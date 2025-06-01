variable "project_id" {
  description = "The GCP project ID"
  type        = string
  default     = "isling-me"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-northeast1"
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "asia-northeast1-a"
}

variable "api_domain" {
  description = "API service domain name"
  type        = string
  default     = "api.dev.isling.me"
}

variable "auth_domain" {
  description = "Auth service domain name"
  type        = string
  default     = "auth.dev.isling.me"
}

variable "mqtt_domain" {
  description = "MQTT service domain name"
  type        = string
  default     = "mqtt.dev.isling.me"
}

variable "traefik_domain" {
  description = "Traefik dashboard domain name"
  type        = string
  default     = "traefik.dev.isling.me"
}

variable "docker_compose_path" {
  description = "Path to docker-compose.yml file"
  type        = string
  default     = "/opt/isling/docker-compose.yml"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "development"
}

variable "instance_count" {
  description = "Number of instances to deploy"
  type        = number
  default     = 1
}

variable "use_preemptible" {
  description = "Use preemptible instances for cost savings (not recommended for production)"
  type        = bool
  default     = false
}

variable "min_instances" {
  description = "Minimum number of instances in auto-scaling group"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of instances in auto-scaling group"
  type        = number
  default     = 3
}

variable "target_cpu_utilization" {
  description = "Target CPU utilization for auto-scaling (0.0 to 1.0)"
  type        = number
  default     = 0.7
}

variable "machine_type" {
  description = "Machine type for instances"
  type        = string
  default     = "e2-medium"
}

variable "enable_cloud_sql" {
  description = "Use Cloud SQL instead of containerized databases (recommended default)"
  type        = bool
  default     = true
}

variable "enable_cloud_armor" {
  description = "Enable Cloud Armor security policies for DDoS protection"
  type        = bool
  default     = true
}

variable "environment_tier" {
  description = "Environment tier: 'dev-staging' for shared resources or 'production' for dedicated resources"
  type        = string
  default     = "dev-staging"
  validation {
    condition     = contains(["dev-staging", "production"], var.environment_tier)
    error_message = "Environment tier must be either 'dev-staging' or 'production'."
  }
}