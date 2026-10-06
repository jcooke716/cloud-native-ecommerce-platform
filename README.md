# Cloud-Native E-Commerce Platform

Portfolio project demonstrating a production-style application delivery workflow using Docker, Kubernetes, Helm, Terraform, AWS, and GitHub.

## Planned Delivery Flow

```text
Source Code
   ↓
Docker Image
   ↓
Container Registry
   ↓
Kubernetes
   ↓
Helm
   ↓
Scaling / Health Checks / Rollback
   ↓
AWS ECR + EKS
   ↓
Terraform-managed infrastructure
```

## Application

The storefront UI is based on the MIT-licensed [iSev7n/ecommerce-template](https://github.com/iSev7n/ecommerce-template). The DevOps, containerization, orchestration, cloud infrastructure, automation, and deployment work in this repository are the focus of this project.

## Project Status

- [ ] Import storefront application
- [ ] Dockerize application
- [ ] Publish image to container registry
- [ ] Deploy to Kubernetes
- [ ] Add health probes and resource limits
- [ ] Add horizontal autoscaling
- [ ] Package with Helm
- [ ] Demonstrate upgrade and rollback
- [ ] Provision AWS resources with Terraform
- [ ] Deploy to Amazon EKS
