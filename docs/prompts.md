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
