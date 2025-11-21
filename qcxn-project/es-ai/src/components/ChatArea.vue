<div
  v-for="message in currentConversation?.messages"
  :key="message.id"
  class="message-item relative flex flex-col gap-3"
></div>
