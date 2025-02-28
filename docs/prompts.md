# Prompts

## Task design

### Design the feature

```plaintext
As a Product Owner, document the feature design in @tasks.md after reviewing @schema.prisma and @technical.md for technical alignment.
Only create the feature design and task description follow feature design process. Do not implement the code.
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
