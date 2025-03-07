# Sprint 006 Planning: Image Processing Optimization

## Sprint Overview

**Sprint Goal:** Deploy imgproxy for image processing optimization to enhance user experience and performance.

**Sprint Duration:** 2 weeks

**Story Points:** 13

## Team Roles and Responsibilities

- **Product Owner:** Define requirements, acceptance criteria, and prioritize tasks
- **Technical Leader:** Provide technical guidance, review architecture, and ensure code quality
- **Developers:** Implement features, write tests, and ensure code quality
- **Scrum Master:** Facilitate sprint planning, daily standups, and remove impediments

## Tasks Breakdown

### INF-001: Deploy imgproxy for Image Processing and Optimization

**Quick Start**:

- Similar Feature: None (new infrastructure component)
- Example Test: src/common/test/health/http-health.check.spec.ts
- Key Files:
  - infra/docker/docker-compose.yml
  - infra/docker/.env.example
  - src/common/config/image-proxy.config.ts
  - src/common/services/image/image.service.ts
  - src/common/services/image/image.types.ts
  - src/common/services/image/image-url.generator.ts
  - src/common/test/image/image.service.spec.ts
- Setup Steps:
  1. Install Docker and Docker Compose
  2. Set up GCP service account with Storage Object Viewer role
  3. Configure environment variables (IMGPROXY_KEY, IMGPROXY_SALT, GCS_KEY_JSON)
  4. Configure allowed source buckets and domains

**Priority**: High
**Dependencies**: None
**Story Points**: 13

**Description**:
Deploy and configure imgproxy service to optimize image delivery for the frontend, enabling efficient image transformations and improved performance. The service will handle image resizing, format conversion, and delivery optimization while maintaining security through URL signing and proper access controls.

**Context**:

- Feature Goal: Optimize image delivery and processing for better user experience
- Similar Features: None (first image processing service)
- Code Patterns:
  - Health Check: src/common/services/health/health.check.ts
  - Service Configuration: src/common/config/config.base.ts
  - URL Generation: src/common/utils/url.utils.ts
- Common Pitfalls:
  - Incorrect GCS permissions or bucket configuration
  - Insecure URL signing implementation
  - Missing CORS configuration for frontend access
  - Insufficient resource limits for high-traffic scenarios
  - Incorrect content-type handling
  - Missing error handling for failed transformations

**Implementation Guide**:

- Architecture Pattern: Microservice with Docker
- Code Style: Follow common module patterns
- Performance Requirements:
  - Image processing latency < 500ms for images up to 5MB
  - Cache hit ratio > 80% for repeated requests
  - Response time < 200ms for cached images
  - Support concurrent processing of up to 50 images/second
  - Memory usage < 512MB under normal load

**Dependencies Map**:

- Upstream:
  - Google Cloud Storage (read access to asset buckets)
  - Environment configuration service
- Downstream:
  - Frontend image components
  - Content creation services
  - User profile services
- External:
  - imgproxy service (v3.19.0)
  - GCS API
  - Docker runtime

**Development Guidelines**:

- Module Structure:
  - Follow: src/common/services pattern
  - Key patterns: Health checks, Configuration, URL Generation
- Error Handling:
  - Use: ImageProcessingError class with specific error types
  - Pattern: Global exception filter with proper error mapping
  - Implement retry mechanism for transient failures
- Testing Strategy:
  - Unit: Configuration, URL generation, and service classes
  - Integration: GCS connectivity, image processing flows
  - E2E: Full image processing pipeline
  - Performance: Load testing with various image sizes
- Documentation:
  - API: Swagger for health endpoints and configuration
  - Technical: Update architecture diagram
  - Operations: Monitoring and alerting setup
  - Security: URL signing and access control documentation

#### Sub-Tasks

##### INF-001.1: Docker Deployment Setup

**Quick Start**:

- Similar Feature: Redis and PostgreSQL Docker setups in the same compose file
- Example Test: src/common/test/health/http-health.check.spec.ts
- Key Files:
  - infra/docker/docker-compose.yml
  - infra/docker/.env.example
  - src/common/config/image-proxy.config.ts
  - src/common/test/health/imgproxy-health.check.spec.ts
- Setup Steps:
  1. Verify Docker and Docker Compose installation
  2. Configure environment variables
  3. Test imgproxy deployment locally
  4. Verify health checks
  5. Test logging configuration

**Status**: In Progress
**Priority**: High
**Story Points**: 3
**Assignee**: DevOps Engineer

**Description**:
Set up and configure imgproxy Docker deployment with proper resource limits, health checks, logging, and integration with the existing infrastructure.

**Context**:

- Feature Goal: Establish reliable and secure imgproxy deployment
- Similar Features:
  - Redis Docker setup (api-redis service)
  - PostgreSQL Docker setup (api-postgres service)
- Code Patterns:
  - Health check implementation in other services
  - Resource limits configuration
  - Traefik integration
- Common Pitfalls:
  - Insufficient memory limits
  - Missing health checks
  - Incorrect network configuration
  - Insecure environment variables

**Implementation Details**:

1. Docker Configuration:

   ```yaml
   imgproxy:
     image: darthsim/imgproxy:v3
     labels:
       - "traefik.enable=true"
       - "traefik.http.routers.imgproxy.rule=Host(`${IMGPROXY_HOST}`)"
       - "traefik.http.services.imgproxy.loadbalancer.server.port=8080"
       - "traefik.http.routers.imgproxy.middlewares=imgproxy-ratelimit"
       - "traefik.http.middlewares.imgproxy-ratelimit.ratelimit.average=100"
       - "traefik.http.middlewares.imgproxy-ratelimit.ratelimit.burst=50"
     environment:
       IMGPROXY_KEY: ${IMGPROXY_KEY}
       IMGPROXY_SALT: ${IMGPROXY_SALT}
       IMGPROXY_MAX_SRC_RESOLUTION: 50
       IMGPROXY_MAX_ANIMATION_FRAMES: 200
       IMGPROXY_ALLOW_ORIGIN: "*"
       IMGPROXY_ENFORCE_WEBP: "true"
       IMGPROXY_ENFORCE_AVIF: "true"
       IMGPROXY_ENABLE_WEBP_DETECTION: "true"
       IMGPROXY_ENABLE_AVIF_DETECTION: "true"
       IMGPROXY_ENABLE_CLIENT_HINTS: "true"
       IMGPROXY_USE_GCS: "true"
       IMGPROXY_GCS_KEY: ${GCS_KEY_JSON}
     healthcheck:
       test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
       interval: 30s
       timeout: 10s
       retries: 3
     networks:
       - vpc-bridge
     deploy:
       resources:
         limits:
           memory: 1G
         reservations:
           memory: 512M
   ```

2. Environment Variables:
   - IMGPROXY_HOST: Image proxy domain
   - IMGPROXY_KEY: URL signing key
   - IMGPROXY_SALT: URL signing salt
   - GCS_KEY_JSON: Base64 encoded GCS service account key

3. Health Check Implementation:
   - HTTP health check endpoint: /health
   - 30-second check interval
   - 10-second timeout
   - 3 retries before marking unhealthy

4. Resource Limits:
   - Memory limit: 1GB
   - Memory reservation: 512MB
   - Rate limiting: 100 req/s average, 50 burst

5. Security Configuration:
   - Traefik integration for routing
   - Rate limiting middleware
   - Environment-based configuration
   - Secure key/salt management

**Technical Notes**:

- Docker compose configuration verified and working
- Health check implementation tested
- Resource limits configured based on performance requirements
- Security measures implemented through Traefik
- Logging configured through Docker default logging driver
- Integration with vpc-bridge network confirmed

**Tasks**:

1. ✓ Review and verify Docker Compose configuration
2. ✓ Configure environment variables
3. ✓ Implement health checks
4. ✓ Set up resource limits
5. ✓ Configure logging
6. ✓ Create monitoring dashboard ticket (INF-002)
7. ✓ Document deployment process

**Quality Checklist**:

- [x] Docker configuration complete and tested
- [x] Environment variables documented
- [x] Health checks implemented and tested
- [x] Resource limits configured
- [x] Security measures implemented
- [x] Logging configured
- [x] Monitoring dashboard ticket created
- [x] Documentation completed

**Acceptance Criteria**:

- [x] imgproxy service starts successfully with Docker Compose
- [x] Health checks are passing
- [x] Resource limits are properly enforced
- [x] Logging is working correctly
- [x] Security measures are in place
- [x] Monitoring ticket created
- [x] Documentation is complete and accurate

**Next Steps**:

1. Begin implementation of INF-002 (Monitoring Dashboard)
2. Proceed with INF-001.2 (GCS Integration)
3. Perform load testing to verify resource limits
4. Review and update documentation based on team feedback

##### INF-001.2: Google Cloud Storage Integration (3 points)

**Status:** In Progress
**Priority:** High
**Assignee:** DevOps Engineer

**Description:**
Configure the integration between imgproxy and Google Cloud Storage to enable image retrieval and processing from cloud storage.

**Tasks:**

1. ✓ Set up GCS service account with minimal required permissions
   - Created service account configuration
   - Documented setup process
   - Added security best practices
2. ✓ Configure GCS access in imgproxy environment variables
   - Added GCS configuration to .env.example
   - Created GCS configuration module
   - Added configuration tests
3. ✓ Implement and test image retrieval from GCS buckets
   - Created integration test suite
   - Added test cases for different scenarios
   - Implemented performance tests
4. ✓ Add security restrictions for allowed buckets
   - Configuration added to .env.example
   - Documentation created
   - Tests implemented
5. ✓ Create documentation for GCS integration
   - Created gcs-setup.md
   - Added troubleshooting guide
   - Added security considerations

**Technical Notes:**

- Service account configuration completed
- Environment variables documented
- Configuration module created with tests
- Integration tests implemented
- Security restrictions documented and tested
- Documentation completed

**Quality Checklist:**

- [x] Service account created with minimal permissions
- [x] Environment variables configured
- [x] Configuration module implemented
- [x] Security restrictions documented
- [x] Integration tests completed
- [x] Documentation created

**Acceptance Criteria:**

- [x] Service account is created with appropriate permissions
- [x] Environment configuration is complete
- [x] imgproxy can retrieve images from GCS buckets
- [x] Security restrictions prevent access to unauthorized buckets
- [x] Documentation is created for GCS integration
- [x] Tests verify successful image retrieval from GCS

**Next Steps:**

1. Review integration test coverage
2. Perform load testing in staging environment
3. Monitor performance metrics
4. Schedule security audit

##### INF-001.3: URL Signing and Security Implementation (2 points)

**Status:** Completed
**Priority:** High
**Assignee:** DevOps Engineer

**Description:**
Implement URL signing and security measures for imgproxy to prevent unauthorized access and ensure secure image processing.

**Tasks:**

1. ✓ Generate and configure key/salt pairs for URL signing
2. ✓ Create URL signing utilities for backend and frontend
3. ✓ Configure allowed sources and referrers
4. ✓ Implement CORS settings for frontend access
5. ✓ Create documentation for security configuration

**Technical Notes:**

- Generated strong key/salt pairs for URL signing
- Implemented proper URL signing algorithm
- Configured allowed sources and referrers
- Set up CORS for frontend access
- Documented security best practices

**Acceptance Criteria:**

- [x] URL signing is implemented and working correctly
- [x] Only signed URLs can access protected images
- [x] Allowed sources and referrers are properly configured
- [x] CORS settings allow frontend access
- [x] Documentation is created for security configuration

##### INF-001.4: Image Processing Configuration (2 points)

**Status:** To Do
**Priority:** Medium
**Assignee:** DevOps Engineer

**Description:**
Configure image processing options in imgproxy to enable efficient transformations and optimizations for different use cases.

**Tasks:**

1. Configure resizing and cropping options
2. Set up format conversion for WebP and AVIF
3. Optimize quality settings for different image types
4. Configure caching for improved performance
5. Create documentation for image processing options

**Technical Notes:**

- Configure optimal resizing algorithms
- Set up format conversion with proper quality settings
- Implement efficient caching strategy
- Test with various image types and sizes
- Document recommended settings for different use cases

**Acceptance Criteria:**

- Resizing and cropping options are properly configured
- Format conversion works correctly for WebP and AVIF
- Quality settings are optimized for different image types
- Caching is configured for improved performance
- Documentation is created for image processing options

##### INF-001.5: Frontend Integration (3 points)

**Status:** To Do
**Priority:** Medium
**Assignee:** Frontend Developer

**Description:**
Develop frontend integration for imgproxy to enable efficient image loading and transformations in the NextJS application.

**Tasks:**

1. Create TypeScript utility functions for URL generation
2. Implement responsive image components with proper srcset
3. Add fallback mechanisms for unsupported browsers
4. Test browser compatibility and performance
5. Create documentation for frontend integration

**Technical Notes:**

- Implement TypeScript utilities for URL generation
- Create responsive image components with proper srcset
- Add fallback mechanisms for older browsers
- Test with various devices and screen sizes
- Document usage patterns and best practices

**Acceptance Criteria:**

- TypeScript utilities generate correct imgproxy URLs
- Responsive image components work correctly on different devices
- Fallback mechanisms handle unsupported browsers
- Browser compatibility tests pass for major browsers
- Documentation is created for frontend integration

## Cancelled Tasks

### NOT-001: User Notification System Implementation

**Status**: Cancelled
**Reason**: Project reprioritization
**Notes**: Work completed will be preserved for future sprints

### NOT-002: Notification Technical Debt Resolution

**Status**: Cancelled
**Reason**: Project reprioritization
**Notes**: Technical debt items to be reassessed in future sprints

## Definition of Done

- All code follows established code style
- Documentation is updated
- Tests are passing with 80% coverage
- Performance metrics meet requirements
- Code review completed
- Integration tests passing
- API documentation updated
- Monitoring and alerts configured

## Sprint Dependencies

- Backend infrastructure must be stable
- Google Cloud Storage access must be configured
- Frontend build pipeline must be operational

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| GCS access issues | High | Low | Test thoroughly and have fallback mechanisms |
| Image processing performance | Medium | Medium | Configure proper caching and optimize settings |
| Frontend integration complexity | Medium | Medium | Early prototyping and testing |
| Security configuration | High | Low | Thorough security review and testing |

## Sprint Review and Demo Plan

- Demo imgproxy deployment and configuration
- Show image transformations and optimizations
- Demonstrate performance improvements
- Review monitoring dashboards

## Code Style Reminder

All developers should follow the established code style guidelines:

1. **TypeScript Best Practices**
   - Use proper typing for all variables, parameters, and return values
   - Create necessary interfaces and types
   - Use PascalCase for classes and interfaces
   - Use camelCase for variables, functions, and methods

2. **Code Organization**
   - Clear separation of concerns
   - Proper error handling
   - Comprehensive documentation with JSDoc
   - Follow established patterns for each component type
