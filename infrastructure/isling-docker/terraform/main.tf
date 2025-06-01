# This code is compatible with Terraform 4.25.0 and versions that are backwards compatible to 4.25.0.
# For information about validating this Terraform code, see https://developer.hashicorp.com/terraform/tutorials/gcp-get-started/google-cloud-platform-build#format-and-validate-the-configuration

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  backend "gcs" {
    bucket = "isling-dev01-tky-devops"
    prefix = "terraform/vibe/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "dns.googleapis.com",
    "artifactregistry.googleapis.com",
    "servicenetworking.googleapis.com",
    "sqladmin.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "iap.googleapis.com",
    "networkmanagement.googleapis.com"
  ])

  project = var.project_id
  service = each.value

  disable_on_destroy = false
}

locals {
  # Isling Naming Convention Variables
  company     = "isling"
  env         = "dev01"
  region_code = "tky"
  system      = "vibe"
  subsystem   = "api"
  domain      = "dev.isling.me"

  # Common tags
  common_labels = {
    environment = "development"
    system      = "vibe"
    subsystem   = "api"
    company     = "isling"
    managed_by  = "terraform"
  }

  # Naming patterns following Isling conventions
  vpc_name               = "${local.company}-${local.env}-${local.system}-vpc"
  subnet_name            = "${local.env}-${local.system}-prv-${local.region_code}"
  router_name            = "${local.env}-${local.region_code}-router-${local.system}"
  nat_name               = "${local.env}-${local.region_code}-nat-${local.system}"
  service_account_name   = "${local.env}-${local.system}-${local.subsystem}"
  artifact_registry_name = "${local.env}-${local.region_code}-main-${local.system}"
  instance_name          = "${local.env}-${local.region_code}-a-${local.subsystem}-${local.system}"
  load_balancer_name     = "${local.env}-apigw-https-ext-${local.system}"
  dns_zone_name          = "${local.env}-${local.system}-public"
  static_ip_name         = "${local.env}-${local.region_code}-staticip-${local.subsystem}"
}

# 1. VPC Network
resource "google_compute_network" "vpc" {
  name                    = local.vpc_name
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"

  depends_on = [google_project_service.required_apis]
}

# 2. Private Subnet
resource "google_compute_subnetwork" "private_subnet" {
  name          = local.subnet_name
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id

  private_ip_google_access = true

  log_config {
    aggregation_interval = "INTERVAL_10_MIN"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# 3. Cloud Router
resource "google_compute_router" "router" {
  name    = local.router_name
  region  = var.region
  network = google_compute_network.vpc.id

  bgp {
    asn = 64514
  }
}

# 4. Cloud NAT
resource "google_compute_router_nat" "nat" {
  name                               = local.nat_name
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# 5. Firewall Rules
resource "google_compute_firewall" "allow_internal" {
  name    = "${local.env}-ingress-allow-internal-${local.system}-all"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.0.1.0/24"]
  target_tags   = ["${local.env}-internal-${local.system}"]
}

resource "google_compute_firewall" "allow_http_https" {
  name    = "${local.env}-ingress-allow-http-${local.system}-tcp"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["${local.env}-http-${local.system}"]
}

resource "google_compute_firewall" "allow_health_check" {
  name    = "${local.env}-ingress-allow-lb-health-${local.system}-tcp"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["80", "8080"]
  }

  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  target_tags   = ["lb-health-check"]
}

resource "google_compute_firewall" "allow_ssh_iap" {
  name    = "${local.env}-ingress-allow-ssh-${local.system}-tcp"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["35.235.240.0/20"]
  target_tags   = ["${local.env}-ssh-${local.system}"]
}

# IAP Tunnel firewall rule for development access
resource "google_compute_firewall" "allow_iap_tunnel" {
  name    = "${local.env}-ingress-allow-iap-tunnel-${local.system}-tcp"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22", "3389", "5432", "6379", "1883", "8083", "8080", "9000"]
  }

  source_ranges = ["35.235.240.0/20"]
  target_tags   = ["${local.env}-iap-tunnel-${local.system}"]

  description = "Allow IAP tunnel access for development tools (SSH, RDP, PostgreSQL, Redis, MQTT, etc.)"
}

# 6. Service Account
resource "google_service_account" "compute_sa" {
  account_id   = local.service_account_name
  display_name = "API Service Compute Service Account"
  description  = "Minimal service account for API Service GCE instances"

  depends_on = [google_project_service.required_apis]
}

resource "google_project_iam_member" "compute_sa_roles" {
  for_each = toset([
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/stackdriver.resourceMetadata.writer",
    "roles/artifactregistry.reader"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.compute_sa.email}"

  depends_on = [google_project_service.required_apis]
}

# 7. Artifact Registry
resource "google_artifact_registry_repository" "api_service_repo" {
  location      = var.region
  repository_id = local.artifact_registry_name
  description   = "Docker repository for API Service images"
  format        = "DOCKER"

  labels = local.common_labels

  depends_on = [google_project_service.required_apis]
}

# 8. Static IP for Load Balancer
resource "google_compute_global_address" "lb_ip" {
  name = local.static_ip_name
}

# 9. Instance Template
resource "google_compute_instance_template" "app_template" {
  name_prefix  = "${local.instance_name}-template-"
  machine_type = var.machine_type

  tags = [
    "${local.env}-http-${local.system}",
    "${local.env}-internal-${local.system}",
    "${local.env}-ssh-${local.system}",
    "${local.env}-iap-tunnel-${local.system}",
    "lb-health-check"
  ]

  labels = local.common_labels

  disk {
    source_image = "projects/cos-cloud/global/images/family/cos-stable"
    auto_delete  = true
    boot         = true
    disk_size_gb = 32
    disk_type    = "pd-balanced"
  }

  network_interface {
    subnetwork = google_compute_subnetwork.private_subnet.id
    # No external IP - private instance
  }

  service_account {
    email  = google_service_account.compute_sa.email
    scopes = ["cloud-platform"]
  }

  shielded_instance_config {
    enable_secure_boot          = false
    enable_vtpm                 = true
    enable_integrity_monitoring = true
  }

  # Enable preemptible if specified
  scheduling {
    preemptible         = var.use_preemptible
    automatic_restart   = !var.use_preemptible
    on_host_maintenance = var.use_preemptible ? "TERMINATE" : "MIGRATE"
    provisioning_model  = var.use_preemptible ? "SPOT" : "STANDARD"
  }

  metadata = {
    enable-oslogin = "true"
    user-data = templatefile("${path.module}/startup-script.yaml", {
      project_id        = var.project_id
      region            = var.region
      artifact_registry = "${var.region}-docker.pkg.dev/${var.project_id}/${local.artifact_registry_name}"
      enable_cloud_sql  = var.enable_cloud_sql
      db_host           = var.enable_cloud_sql ? google_sql_database_instance.postgres[0].private_ip_address : "localhost"
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

# 10. Managed Instance Group
resource "google_compute_region_instance_group_manager" "app_mig" {
  name   = "${local.env}-${local.region_code}-mig-${local.system}"
  region = var.region

  base_instance_name = local.instance_name
  target_size        = var.min_instances

  version {
    instance_template = google_compute_instance_template.app_template.id
  }

  named_port {
    name = "http"
    port = 80
  }

  auto_healing_policies {
    health_check      = google_compute_health_check.app_health_check.id
    initial_delay_sec = var.use_preemptible ? 180 : 300 # Faster healing for preemptible
  }

  update_policy {
    type                         = "PROACTIVE"
    instance_redistribution_type = "PROACTIVE"
    minimal_action               = "REPLACE"
    max_surge_fixed              = 0
    max_unavailable_fixed        = 3
  }

  # Auto-healing is more aggressive for preemptible instances
  wait_for_instances = var.use_preemptible ? false : true
}

# Auto-scaling policy
resource "google_compute_region_autoscaler" "app_autoscaler" {
  name   = "${local.env}-${local.region_code}-autoscaler-${local.system}"
  region = var.region
  target = google_compute_region_instance_group_manager.app_mig.id

  autoscaling_policy {
    max_replicas    = var.max_instances
    min_replicas    = var.min_instances
    cooldown_period = 60

    cpu_utilization {
      target = var.target_cpu_utilization
    }

    # Scale based on load balancer utilization
    load_balancing_utilization {
      target = 0.8
    }
  }
}

# 11. Health Check
resource "google_compute_health_check" "app_health_check" {
  name = "${local.env}-healthcheck-${local.system}"

  timeout_sec         = 5
  check_interval_sec  = var.use_preemptible ? 5 : 10 # More frequent checks for preemptible
  healthy_threshold   = 2
  unhealthy_threshold = var.use_preemptible ? 2 : 3 # Faster failure detection for preemptible

  http_health_check {
    port         = "80"
    request_path = "/health"
  }
}

# 12. Backend Service
resource "google_compute_backend_service" "app_backend" {
  name          = "${local.env}-backend-${local.system}"
  health_checks = [google_compute_health_check.app_health_check.id]
  protocol      = "HTTP"
  port_name     = "http"
  timeout_sec   = 30

  backend {
    group           = google_compute_region_instance_group_manager.app_mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }

  security_policy = var.enable_cloud_armor ? google_compute_security_policy.security_policy[0].id : null
}

# Cloud Armor Security Policy
resource "google_compute_security_policy" "security_policy" {
  count = var.enable_cloud_armor ? 1 : 0
  name  = "${local.env}-security-policy-${local.system}"

  description = "Cloud Armor security policy for API Service DDoS protection"

  # Default rule - allow all traffic
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow rule"
  }

  # Rate limiting rule - basic DDoS protection
  rule {
    action   = "rate_based_ban"
    priority = "1000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Rate limit rule for DDoS protection"

    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"

      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }

      ban_duration_sec = 600
    }
  }

  # Block common malicious IPs (example - customize as needed)
  rule {
    action   = "deny(403)"
    priority = "2000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = [
          "10.0.0.0/8",      # Private networks (shouldn't reach public LB)
          "172.16.0.0/12",   # Private networks
          "192.168.0.0/16"   # Private networks
        ]
      }
    }
    description = "Block private IP ranges"
  }

  adaptive_protection_config {
    layer_7_ddos_defense_config {
      enable          = true
      rule_visibility = "STANDARD"
    }
  }
}

# 13. URL Map
resource "google_compute_url_map" "app_url_map" {
  name            = "${local.env}-urlmap-${local.system}"
  default_service = google_compute_backend_service.app_backend.id
}

# 14. SSL Certificate
resource "google_compute_managed_ssl_certificate" "app_ssl_cert" {
  name = "${local.env}-ssl-cert-${local.system}"

  managed {
    domains = [
      var.api_domain,
      var.auth_domain,
      var.mqtt_domain,
      var.traefik_domain
    ]
  }
}

# 15. HTTPS Proxy
resource "google_compute_target_https_proxy" "app_https_proxy" {
  name             = "${local.env}-https-proxy-${local.system}"
  url_map          = google_compute_url_map.app_url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.app_ssl_cert.id]
}

# 16. Global Forwarding Rule
resource "google_compute_global_forwarding_rule" "app_forwarding_rule" {
  name       = local.load_balancer_name
  target     = google_compute_target_https_proxy.app_https_proxy.id
  port_range = "443"
  ip_address = google_compute_global_address.lb_ip.address
}

# 17. HTTP to HTTPS Redirect
resource "google_compute_url_map" "http_redirect" {
  name = "${local.env}-http-redirect-${local.system}"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "http_proxy" {
  name    = "${local.env}-http-proxy-${local.system}"
  url_map = google_compute_url_map.http_redirect.id
}

resource "google_compute_global_forwarding_rule" "http_forwarding_rule" {
  name       = "${local.env}-http-redirect-${local.system}"
  target     = google_compute_target_http_proxy.http_proxy.id
  port_range = "80"
  ip_address = google_compute_global_address.lb_ip.address
}

# 18. Cloud DNS Zone
resource "google_dns_managed_zone" "app_dns_zone" {
  name     = local.dns_zone_name
  dns_name = "${local.domain}."

  labels = local.common_labels
}

# 19. DNS A Records for backend services only
resource "google_dns_record_set" "api_dns_record" {
  name = "${var.api_domain}."
  type = "A"
  ttl  = 300

  managed_zone = google_dns_managed_zone.app_dns_zone.name
  rrdatas      = [google_compute_global_address.lb_ip.address]
}

resource "google_dns_record_set" "auth_dns_record" {
  name = "${var.auth_domain}."
  type = "A"
  ttl  = 300

  managed_zone = google_dns_managed_zone.app_dns_zone.name
  rrdatas      = [google_compute_global_address.lb_ip.address]
}

resource "google_dns_record_set" "mqtt_dns_record" {
  name = "${var.mqtt_domain}."
  type = "A"
  ttl  = 300

  managed_zone = google_dns_managed_zone.app_dns_zone.name
  rrdatas      = [google_compute_global_address.lb_ip.address]
}

resource "google_dns_record_set" "traefik_dns_record" {
  name = "${var.traefik_domain}."
  type = "A"
  ttl  = 300

  managed_zone = google_dns_managed_zone.app_dns_zone.name
  rrdatas      = [google_compute_global_address.lb_ip.address]
}

# Cloud SQL for production database (optional)
resource "google_sql_database_instance" "postgres" {
  count            = var.enable_cloud_sql ? 1 : 0
  name             = "${local.env}-${local.system}-postgres"
  database_version = "POSTGRES_17"
  region           = var.region

  settings {
    tier              = var.environment_tier == "production" ? "db-f1-micro" : "db-f1-micro" # Start with f1-micro for all
    availability_type = var.environment_tier == "production" ? "REGIONAL" : "ZONAL"          # HA for production
    disk_type         = "PD_SSD"
    disk_size         = var.environment_tier == "production" ? 20 : 12 # More storage for production
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      location                       = var.region
      point_in_time_recovery_enabled = var.environment_tier == "production" # PITR for production
      backup_retention_settings {
        retained_backups = var.environment_tier == "production" ? 30 : 7 # More backups for production
      }
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }

    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }

    # Performance tuning for production
    dynamic "database_flags" {
      for_each = var.environment_tier == "production" ? [1] : []
      content {
        name  = "shared_buffers"
        value = "32MB"
      }
    }

    maintenance_window {
      day          = 7
      hour         = 3
      update_track = "stable"
    }
  }

  deletion_protection = var.environment_tier == "production" ? true : false # Flexible for dev/staging
  depends_on          = [google_service_networking_connection.private_vpc_connection]
}

# Private service connection for Cloud SQL
resource "google_compute_global_address" "private_ip_address" {
  count         = var.enable_cloud_sql ? 1 : 0
  name          = "${local.env}-private-ip-address-${local.system}"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  count                   = var.enable_cloud_sql ? 1 : 0
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address[0].name]
}

# Databases
resource "google_sql_database" "api_database" {
  count    = var.enable_cloud_sql ? 1 : 0
  name     = "api"
  instance = google_sql_database_instance.postgres[0].name
}

resource "google_sql_database" "auth_database" {
  count    = var.enable_cloud_sql ? 1 : 0
  name     = "auth"
  instance = google_sql_database_instance.postgres[0].name
}

# Database users
resource "google_sql_user" "api_user" {
  count    = var.enable_cloud_sql ? 1 : 0
  name     = "api_user"
  instance = google_sql_database_instance.postgres[0].name
  password = random_password.api_db_password[0].result
}

resource "google_sql_user" "auth_user" {
  count    = var.enable_cloud_sql ? 1 : 0
  name     = "auth_user"
  instance = google_sql_database_instance.postgres[0].name
  password = random_password.auth_db_password[0].result
}

# Random passwords for database users
resource "random_password" "api_db_password" {
  count   = var.enable_cloud_sql ? 1 : 0
  length  = 32
  special = true
}

resource "random_password" "auth_db_password" {
  count   = var.enable_cloud_sql ? 1 : 0
  length  = 32
  special = true
}

# Outputs
output "load_balancer_ip" {
  description = "Load balancer IP address"
  value       = google_compute_global_address.lb_ip.address
}

output "dns_name_servers" {
  description = "DNS name servers for domain delegation"
  value       = google_dns_managed_zone.app_dns_zone.name_servers
}

output "application_url" {
  description = "Application URL"
  value       = "https://${var.api_domain}"
}

output "artifact_registry_url" {
  description = "Artifact Registry URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${local.artifact_registry_name}"
}

output "service_account_email" {
  description = "Service account email"
  value       = google_service_account.compute_sa.email
}

output "instance_type" {
  description = "Instance type being used"
  value       = var.use_preemptible ? "preemptible (spot)" : "regular"
}

output "estimated_monthly_cost" {
  description = "Estimated monthly cost for infrastructure"
  value = var.environment_tier == "production" ? (
    var.enable_cloud_armor ? (
      var.use_preemptible ? "~$31.50 (production: f1-micro SQL + preemptible VM + Cloud Armor)" : "~$53 (production: f1-micro SQL + regular VM + Cloud Armor)"
      ) : (
      var.use_preemptible ? "~$29.50 (production: f1-micro SQL + preemptible VM)" : "~$51 (production: f1-micro SQL + regular VM)"
    )
    ) : (
    var.enable_cloud_armor ? (
      var.use_preemptible ? "~$33.65 (dev-staging: f1-micro SQL + preemptible VM + Cloud Armor)" : "~$55.65 (dev-staging: f1-micro SQL + regular VM + Cloud Armor)"
      ) : (
      var.use_preemptible ? "~$31.65 (dev-staging: f1-micro SQL + preemptible VM)" : "~$53.65 (dev-staging: f1-micro SQL + regular VM)"
    )
  )
}

output "cloud_armor_config" {
  description = "Cloud Armor security configuration"
  value = var.enable_cloud_armor ? {
    enabled         = true
    security_policy = google_compute_security_policy.security_policy[0].name
    policy_id       = google_compute_security_policy.security_policy[0].id
    ddos_protection = "Layer 7 adaptive protection enabled"
    rate_limiting   = "100 requests per minute per IP"
    blocked_attacks = ["Private IP ranges", "Rate limiting"]
    cost_per_month  = "$2.00"
    status          = "Cloud Armor protection enabled"
    } : {
    enabled         = false
    security_policy = null
    policy_id       = null
    ddos_protection = null
    rate_limiting   = null
    blocked_attacks = []
    cost_per_month  = "$0.00"
    status          = "Cloud Armor protection disabled"
  }
}

output "scaling_configuration" {
  description = "Auto-scaling configuration"
  value = {
    min_instances = var.min_instances
    max_instances = var.max_instances
    target_cpu    = var.target_cpu_utilization
    machine_type  = var.machine_type
  }
}

output "database_connection" {
  description = "Database connection information"
  value = var.enable_cloud_sql ? {
    host     = google_sql_database_instance.postgres[0].private_ip_address
    instance = google_sql_database_instance.postgres[0].name
    api_db   = google_sql_database.api_database[0].name
    auth_db  = google_sql_database.auth_database[0].name
    } : {
    status = "Using containerized databases"
  }
  sensitive = false
}

output "database_passwords" {
  description = "Database user passwords (sensitive)"
  value = var.enable_cloud_sql ? {
    api_user  = random_password.api_db_password[0].result
    auth_user = random_password.auth_db_password[0].result
  } : {}
  sensitive = true
}