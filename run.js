const repl = require("repl");
const selectors = require("./selectors");
const utils = require("./utils");

module.exports = (page, processMessages) => {
  let state = {
    selectedChat: "",
    running: false,
    messages: {},
    newMessages: []
  };

  const showState = () => state;

  const getChats = async () => {
    return page.evaluate(
      ([
        chatItemSelector,
        chatNameSelector,
        lastMessageSelector,
        unreadCountSelector
      ]) => {
        const chatItemEls = document.querySelectorAll(chatItemSelector);

        const chatItems = Array.from(chatItemEls).reduce(
          (acc, el) => {
            const nameEl = el.querySelector(chatNameSelector);
            const name = nameEl && nameEl.getAttribute("title");
            const lastMessageEl = el.querySelector(lastMessageSelector);
            const lastMessage = lastMessageEl && lastMessageEl.textContent;
            const unreadCountEl = el.querySelector(unreadCountSelector);
            const unreadCount =
              unreadCountEl && parseInt(unreadCountEl.textContent);

            acc.lastMessages[name] = lastMessage;
            acc.unreadCount[name] = unreadCount;
            return acc;
          },
          {
            lastMessages: {},
            unreadCount: {}
          }
        );
        return Promise.resolve(chatItems);
      },
      [
        selectors.chat_item,
        selectors.chat_name,
        selectors.last_message,
        selectors.unread_count
      ]
    );
  };

  const getUnread = async () =>
    page.evaluate(selector => {
      const unreadEls = document.querySelectorAll(selector);
      const unread = Array.from(unreadEls).map(el => el.textContent);
      return Promise.resolve(unread);
    }, selectors.unread_messages);

  // compare last X messages in snapshot vs now,
  // in order to detect new messages
  const getNewMessages = async () => {
    // if previous messages have never been recorded aka undefined
    // only look for items under the 'unread' banner
    let newMessages = [];

    const messages = await page.evaluate(selector => {
      const messageEls = document.querySelectorAll(selector);
      const messages = Array.from(messageEls).map(el => el.textContent);
      return Promise.resolve(messages);
    }, selectors.message_in);

    if (typeof state.messages[state.selectedChat] === "undefined") {
      newMessages = await getUnread();
      state.messages[state.selectedChat] = messages;
    } else {
      const prevMessages = state.messages[state.selectedChat];
      const newMessageCount = messages.length - prevMessages.length;
      if (newMessageCount > 0) {
        newMessages = messages.slice(-newMessageCount);
        state.messages[state.selectedChat] = messages;
      }
    }
    state.newMessages = state.newMessages.concat(
      newMessages.map(text => ({ chatName: state.selectedChat, text }))
    );
  };

  const selectChat = async chatName => {
    await page.click(selectors.chat_item_with_title(chatName));
    state.selectedChat = chatName;
  };

  const sendMessage = async (chatName, text) => {
    await selectChat(chatName);
    await page.click(selectors.message_input);
    await page.keyboard.type(text);
    await page.keyboard.press("Enter");
  };

  // clicks the thread to clear unread count
  const investigateUnread = async unread => {
    const unreadChats = Object.entries(unread).reduce(
      (acc, [chatName, unreadCount]) => {
        if (unreadCount) {
          acc.push(chatName);
        }
        return acc;
      },
      []
    );
    await unreadChats
      .map(chatName => async () => {
        await selectChat(chatName);
        await getNewMessages();
      })
      .reduce((promise, func) => promise.then(func), Promise.resolve());
  };

  const writeReplies = async replies => {
    replies
      .map(({ chatName, text }) => async () => {
        await sendMessage(chatName, text);
        // harvest any new messages before leaving the page
        await getNewMessages();
      })
      .reduce((promise, func) => promise.then(func), Promise.resolve());
  };

  const poll = async () => {
    console.log("polling...", Math.random());
    const { unreadCount } = await getChats();

    if (state.selectedChat) {
      await getNewMessages();
    }
    await investigateUnread(unreadCount);
    const gracePeriod = utils.wait(1000);

    const newMessages = state.newMessages;
    state.newMessages = [];
    const replies = await processMessages(newMessages);
    await writeReplies(replies);

    // unread badge does not go away immediately
    // hence it is not a reliable way to check for new messages at high frequency
    // set a buffer of ~1s to ensure it clears
    await gracePeriod;
    console.log("to be processed:", newMessages);
    console.log("to be sent:", replies);
  };

  const startPoll = async () => {
    state.running = true;
    while (state.running) {
      await poll();
    }
  };

  const stopPoll = () => {
    state.running = false;
  };

  const r = repl.start();
  r.context.cmd = {
    showState,
    poll,
    startPoll,
    stopPoll,
    getNewMessages,
    selectChat,
    sendMessage
  };
};
