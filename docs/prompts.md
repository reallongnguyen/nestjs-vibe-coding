# Prompts

## Task design

### Design the feature

```plaintext
As a Product Owner, design follow feature between user. This feature use in notification and content distribution feature.
- write feature design to @business.md 
- add new table to @schema.prisma. Add index to reduce query time
- add task to @backlog.md 
```

Attach files:

- `/tasks/tasks.md`
- `/docs/task-template.md`
- `/tasks/status.md`
- `/prisma/schema.prisma`
- `/docs/business-domain.md`
- `/docs/business.md`
- `/docs/module-structure.md`
- `/docs/technical.md`

### Compare feature with major platforms

```plaintext
As a Product Owner, compare your suggested New Design: Personalized Feed Distribution with feed distribution features in TikTok, Instagram and Facebook.
```

### Ask solution architecture design the architecture of the feature

```plaintext
As a senior solution architect, analyze the Updated Feed Distribution Strategy: TikTok-Inspired Approach in @business.md. Deep dive into Technical Considerations, then design the system architecture for each phase in Implementation Phases to ensure the feature reaches its goals and remains scalable. Write the design into @business.md
```

### Update task description follow new rules

```plaintext
Follow new feature design process and task template in @task-template.md update tasks that not yet implemented in @tasks.md
```

Attach files:

- `/tasks/tasks.md`
- `/docs/task-template.md`
- `/tasks/status.md`
- `/prisma/schema.prisma`
- `/docs/business-domain.md`
- `/docs/business.md`
- `/docs/module-structure.md`
- `/docs/technical.md`

### Change request

```plaintext
As a professional Product Owner, define task description for task bellow with hight priority. Add these tasks to current sprint in @tasks.md 
1. Remove post like, post view features in @content module. Context: Social Engagement already support post.
2. Refactor comment APIs to allow support many type of content follow @social-engagement.controller.ts 
```

Attach files:

- `/tasks/tasks.md`
- `/docs/task-template.md`
- `/tasks/status.md`
- `/prisma/schema.prisma`
- `/docs/business-domain.md`

### Sprint planning

```plaintext
As a Scrum Master, plan the sprint 004 in @status.md.
- Add SOC-006 and NOT-000 in @backlog.md to @tasks.md follow task template in @task-template.md and ### STEP 3: Create task specification in ## feature design process.
- Break task to small and simple sub tasks.
```

Attach files:

- `/tasks/tasks.md`
- `/tasks/status.md`
- `/tasks/task-template.md`
- `/tasks/backlog.md`
- `/docs/business.md`
- `/docs/technical.md`

## Code implementation

### Implement the feature

```plaintext
As a senior developer, follow the development process you implement tasks <XXXX> in @tasks.md. Follow code style in @technical.md and `/src/social`. After implementing the feature, update @tasks.md and @status.md.
```

Attach files:

- `/tasks/tasks.md`
- `/tasks/status.md`
- `/docs/technical.md`
- `/docs/module-structure.md`
- `/prisma/schema.prisma`
- `/docs/architecture.mermaid`

### Ask cursor to fix code

```plaintext
In @user-follow-service.interface.ts, you are importing presentation DTOs, this is not follow clean architecture. Create service layer own Input and Output class.
```

```plaintext
Follow @AppError.ts, fix UserFollowError in @user-follow.error.ts 
```

## Refactor the code

```plaintext
As a senior developer, refactor code in <XXXX> follow code style in @content module
```

Attach files:

- `/src/content`
- `/docs/technical.md`
- `/docs/module-structure.md`
- `/prisma/schema.prisma`
- `/docs/architecture.mermaid`

## Change request complex feature

### Request PO and SA design new approach

Request PO to design new approach of feed distribution

```plaintext
As a product owner, compare your suggested New Design: Personalized Feed Distribution with feed distribution features in TikTok, Instagram and Facebook.
```

```plaintext
I prefer TikTok's approach. Let's modify your Recommended Adjustments and document the new design in @business.md
```

Request SA to design system architecture for each phase in Implementation Phases

```plaintext
As a senior solution architect, analyze the Updated Feed Distribution Strategy: TikTok-Inspired Approach in @business.md. Deep dive into Technical Considerations, then design a system architecture for each phase in Implementation Phases to ensure the feature reaches its goals and remains scalable. Write the design into @business.md
```

### Request SM and PO update sprint plan and task description

```plaintext
As a Scrum Master, update sprint plan in @status.md. SOC-006-5 is blocked by new distribution system that not yet implemented. Check if the rest of tasks in current sprint are still valid.
```

```plaintext
As a product owner, update task description in @tasks.md. SOC-006-5 is blocked by new distribution system that not yet implemented. Check if the rest of tasks in current sprint are still valid.
```

```plaintext
Hey scum master, what next tasks can we implement in current sprint? 
```

Implement the rest of tasks in current sprint before implement new Distribution system.
