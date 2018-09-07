module.exports = {
  message_input: "._2S1VP.copyable-text.selectable-text",
  chat_item: "#pane-side ._3j7s9",
  chat_name: "#pane-side ._25Ooe span._1wjpf",
  unread_count: "#pane-side span.OUeyt",
  last_message: "#pane-side ._2_LEW span._1wjpf._3NFp9",
  all_messages:
    ".message-in span.selectable-text, .message-out span.selectable-text",
  message_in: ".message-in span.selectable-text",
  message_out: ".message-out span.selectable-text",
  unread_message_separator: "._1mq8g", //span.L89LI,
  unread_messages: "._1mq8g ~ div .message-in span.selectable-text",
  chat_item_with_title: title =>
    `#pane-side ._25Ooe span._1wjpf[title="${title}"]`,
  side_pane: "#pane-side"
};
