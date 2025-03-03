# Prompts

## Initial project

Create `.cursorrules` first

```plaintext
Analyze source code of this frontend project
- write folder structure to @folder-structure.md 
- write business to @business.md 
- write technical to @technical.md 
```

## Application scope

Share files:

- backlog.md
- status.overall.md
- schema.prisma
- api.json
- business.md

### Compare feature with major platforms

```plaintext
As a Product Owner, compare your suggested New Design: Personalized Feed Distribution with feed distribution features in TikTok, Instagram and Facebook.
```

### Ask solution architecture design the architecture of the feature

```plaintext
As a senior solution architect, analyze the Updated Feed Distribution Strategy: TikTok-Inspired Approach in @business.md. Deep dive into Technical Considerations, then design the system architecture for each phase in Implementation Phases to ensure the feature reaches its goals and remains scalable. Write the design into @business.md
```

### Ask PO create task for both frontend and backend, write task design to backlog

```plaintext
As a product owner, design task for feature XXXX.
Write task in @backlog.md for both Frontend and Backend team, note PIC of each task.
Request Solution Architecture and Designer to help you design tasks. Break task to smaller tasks if task is complex.
Follow task feature design process.
```

> Sync data to Frontend and Backend

## Backend workflow

### Design the feature

```plaintext
As a Product Owner, design follow feature between user. This feature use in notification and content distribution feature.
- write feature design to @business.md 
- add new table to @schema.prisma. Add index to reduce query time
- add task to @backlog.md 
```

Attach files:

- `/tasks/sprint-current-tasks.md`
- `/docs/task-template.md`
- `/tasks/sprint-current-status.md`
- `/prisma/schema.prisma`
- `/docs/business-domain.md`
- `/docs/business.md`
- `/docs/module-structure.md`
- `/docs/technical.md`

### Update task description follow new rules

```plaintext
Follow new feature design process and task template in @task-template.md update tasks that not yet implemented in @sprint-current-tasks.md
```

Attach files:

- `/tasks/sprint-current-tasks.md`
- `/docs/task-template.md`
- `/tasks/sprint-current-status.md`
- `/prisma/schema.prisma`
- `/docs/business-domain.md`
- `/docs/business.md`
- `/docs/module-structure.md`
- `/docs/technical.md`

### Change request

```plaintext
As a professional Product Owner, define task description for task bellow with hight priority. Add these tasks to current sprint in @sprint-current-tasks.md 
1. Remove post like, post view features in @content module. Context: Social Engagement already support post.
2. Refactor comment APIs to allow support many type of content follow @social-engagement.controller.ts 
```

Attach files:

- `/tasks/sprint-current-tasks.md`
- `/docs/task-template.md`
- `/tasks/sprint-current-status.md`
- `/prisma/schema.prisma`
- `/docs/business-domain.md`

### Sprint planning

```plaintext
As Scrum Master, plan the sprint 006. Take tasks in @backlog.md.
Discuss Product Owner if she want to priority other features.
Remind developer follow code style in social module
```

Attach files:

- `/tasks/sprint-current-tasks.md`
- `/tasks/sprint-current-status.md`
- `/tasks/task-template.md`
- `/tasks/backlog.md`
- `/docs/business.md`
- `/docs/technical.md`

### Quick Design

Infrastructure investigate

```plaintext
As a Solution Architecture, investigate imgproxy service at @https://github.com/imgproxy/imgproxy .
Context: currently, system save images as Google Cloud Storage object url such gs://bucket-name/path/file.png. We need imgproxy to help Frontend (nextjs) get image.
Let create short note as technical blog in @image-proxy.md then design infrasture task INF-001 in @backlog.md. At first stage, I want deploy imgproxy in docker system follow @README.md 
```

Create API specification

```plaintext
As a Technical Leader
- design API specification and Event Interface, Command Interface for each tasks in @sprint-current-tasks.md. Follow API style in identity module @user.controller.ts, @user.input.ts, @user.output.ts.
- Design Event, Command Interface in common module.
then update design to task description.

Do not implement code.
```

Attach files:

- `/prisma/schema.prisma`
- Collection class
- BaseEvent class

## Code implementation

### Implement the feature

```plaintext
As a senior developer, follow the development process you implement tasks XXXX in @sprint-current-tasks.md. Follow code style in @technical.md and `/src/social`. After implementing the feature, update @sprint-current-tasks.md and @sprint-current-status.md.
```

Attach files:

- `/tasks/sprint-current-tasks.md`
- `/tasks/sprint-current-status.md`
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

### Refactor the code

```plaintext
As a senior developer, refactor code in <XXXX> follow code style in @content module
```

Attach files:

- `/src/content`
- `/docs/technical.md`
- `/docs/module-structure.md`
- `/prisma/schema.prisma`
- `/docs/architecture.mermaid`

## Sprint Review

```plaintext
Hey Scrum Master, check status of whole task in current sprint then update @sprint-current-status.md. If task was done, please remote it from @backlog.md.
Request developer update @technical.md and request solution architecture @architecture.mermaid 
```

```plaintext
Hey scrum master, as we close current sprint, let change name @sprint-current-tasks.md to format sprint-xxx-tasks.md and also change name of @sprint-current-status.md. Prepare empty @sprint-current-tasks.md and @sprint-current-status.md to the next sprint.
```

## Case study

### Change request a complex feature

#### Request PO and SA design new approach

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

#### Request SM and PO update sprint plan and task description

```plaintext
As a Scrum Master, update sprint plan in @sprint-current-status.md. SOC-006-5 is blocked by new distribution system that not yet implemented. Check if the rest of tasks in current sprint are still valid.
```

```plaintext
As a product owner, update task description in @sprint-current-tasks.md. SOC-006-5 is blocked by new distribution system that not yet implemented. Check if the rest of tasks in current sprint are still valid.
```

```plaintext
Hey scum master, what next tasks can we implement in current sprint? 
```

Implement the rest of tasks in current sprint before implement new Distribution system.
