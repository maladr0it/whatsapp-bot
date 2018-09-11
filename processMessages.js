const utils = require("./utils");

const state = {
  queue: []
};

const handleMessage = async (chatName, text) => {
  if (/^\d$/.test(text)) {
    const waitPeriod = parseInt(text);
    await utils.wait(waitPeriod * 1000);
    return {
      chatName,
      text: `I waited ${waitPeriod} seconds before replying.`
    };
  }
  // return null;
  return {
    chatName,
    text: `Sorry, I don't understand that request.`
  };
};

const processMessages = async messages => {
  messages.forEach(async ({ chatName, text }) => {
    const reply = await handleMessage(chatName, text);
    if (reply) {
      state.queue.push(reply);
    }
  });

  const responses = state.queue;
  state.queue = [];
  return responses;
};

module.exports = processMessages;
