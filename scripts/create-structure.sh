#!/bin/bash

# Create main module directories
mkdir -p src/{identity,content,social,gamification,ai}/{entities,repositories,services,presentation/dtos}

# Identity Management Module
touch src/identity/identity.module.ts
touch src/identity/entities/{user,user-role,user-activity,space-member-role}.entity.ts
touch src/identity/repositories/{user,user-role,user-activity}.repository.ts
touch src/identity/services/identity.service.ts
touch src/identity/presentation/{identity.controller.ts,dtos/{create-user,update-user}.dto.ts}

# Content Management Module
touch src/content/content.module.ts
touch src/content/entities/{draft-post,published-post,comment,topic,post-topic,space}.entity.ts
touch src/content/repositories/{post,comment,topic,space}.repository.ts
touch src/content/services/content.service.ts
touch src/content/presentation/{content.controller.ts,dtos/{create-post,update-post}.dto.ts}

# Social Engagement Module
touch src/social/social.module.ts
touch src/social/entities/{post-like,comment-like,bookmark,feed,notification}.entity.ts
touch src/social/repositories/{like,bookmark,feed,notification}.repository.ts
touch src/social/services/social.service.ts
touch src/social/presentation/{social.controller.ts,dtos/{create-like,create-bookmark}.dto.ts}

# Gamification Module
touch src/gamification/gamification.module.ts
touch src/gamification/entities/{user-emotion,user-streak,achievement,user-achievement}.entity.ts
touch src/gamification/repositories/{emotion,streak,achievement}.repository.ts
touch src/gamification/services/gamification.service.ts
touch src/gamification/presentation/{gamification.controller.ts,dtos/{create-emotion,track-achievement}.dto.ts}

# AI Services Module
touch src/ai/ai.module.ts
touch src/ai/entities/{bot,bot-type,bot-interaction}.entity.ts
touch src/ai/repositories/bot.repository.ts
touch src/ai/services/ai.service.ts
touch src/ai/presentation/{ai.controller.ts,dtos/{create-bot,bot-interaction}.dto.ts} 