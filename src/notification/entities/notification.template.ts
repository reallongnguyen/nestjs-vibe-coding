export const notificationTemplate = {
  vi: {
    updateProfile:
      '<d class="font-semibold text-blue-400" type="user">{{ subjects.0.name }}</d> đã cập nhật thông tin cá nhân',
    likePost: `<d class="font-semibold" type="user">{{ subjects.0.name }}</d>{{#if (gt subject_count 1) }} và {{ math subject_count '-' 1 }} người khác{{/if}} đã thích bài viết {{ diObject.name }} của bạn{{#if prObject}} trong {{ prObject.name }}{{/if}}`,
    comment:
      '<d class="font-semibold" type="user">{{ subjects.0.name }}</d> đã bình luận bài viết {{ diObject.name }} của bạn{{#if prObject}} trong {{ prObject.name }}{{/if}}',
    repComment:
      '<d class="font-semibold" type="user">{{ subjects.0.name }}</d> đã trả lời bình luận của {{ inObject.name }}{{#if prObject}} trong {{ prObject.name }}{{/if}}',
  },
};
