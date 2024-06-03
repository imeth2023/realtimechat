<script setup>
import { io } from 'socket.io-client';
import { onBeforeMount, ref } from 'vue';

const socket = io('http://localhost:3001');

const messages = ref([]); // Array to store chat messages
const notifications = ref([]); // Array to store notifications
const messageText = ref(''); // Text input for sending messages
const joined = ref(false); // Flag to indicate if user has joined a room
const nameEntered = ref(false); // Flag to indicate if user has entered their name
const name = ref(''); // User's name
const typingDisplay = ref(''); // Text to display when someone is typing
const selectedRoom = ref('room1'); // Default room
const currentRoom = ref(''); // Currently selected room
const onlineUsers = ref([]); // Array to store online users
const privateMessageRecipient = ref(null); // User to send private messages to

onBeforeMount(() => {
  // Event listener for receiving messages
  socket.on('message', (message) => {
    if (!privateMessageRecipient.value) {
      messages.value.push(message);
    }
  });

  // Event listener for receiving private messages
  socket.on('privateMessage', (message) => {
    if (message.senderName === name.value || message.recipientName === name.value) {
      messages.value.push(message);
    }
  });

  // Event listener for receiving new direct message notifications
  socket.on('newDirectMessageNotification', ({ message, from }) => {
    notifications.value.push({
      message: `New message from ${from}: "${message}"`,
      from,
    });
  });

  // Event listener for receiving typing notifications
  socket.on('typing', ({ name, isTyping }) => {
    if (isTyping) {
      typingDisplay.value = `${name} is typing...`;
    } else {
      typingDisplay.value = '';
    }
  });

  // Event listener for receiving online user list
  socket.on('onlineUsers', (userList) => {
    onlineUsers.value = userList.map(user => ({ id: user.id, name: user.name }));
  });
});

// Function to enter user's name
const enterName = () => {
  socket.emit('join', { name: name.value, room: selectedRoom.value }, (response) => {
    messages.value = response;
    currentRoom.value = selectedRoom.value;
  });
  nameEntered.value = true;
};

// Function to join a room
const joinRoom = () => {
  socket.emit('join', { name: name.value, room: selectedRoom.value }, (response) => {
    messages.value = response;
    currentRoom.value = selectedRoom.value;
  });
  joined.value = true;
  privateMessageRecipient.value = null; // Reset private message recipient
};

// Function to change the current room
const changeRoom = () => {
  socket.emit('leaveRoom', { room: currentRoom.value });
  socket.emit('join', { name: name.value, room: selectedRoom.value }, (response) => {
    messages.value = response;
    currentRoom.value = selectedRoom.value;
  });
};

// Function to send a message
const sendMessage = () => {
  const payload = { text: messageText.value };
  if (privateMessageRecipient.value) {
    payload.recipientName = privateMessageRecipient.value.name;
  } else {
    payload.room = currentRoom.value;
  }
  socket.emit('createMessage', payload, () => {
    messageText.value = '';
  });
};

let timeout;
// Function to emit typing event
const emitTyping = () => {
  socket.emit('typing', { name: name.value, room: currentRoom.value, isTyping: true });
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    socket.emit('typing', { name: name.value, room: currentRoom.value, isTyping: false });
  }, 2000);
};

// Function to select a user for private messaging
const selectPrivateMessageRecipient = (user) => {
  privateMessageRecipient.value = user;
  messages.value = []; // Clear messages to show only private messages
  socket.emit('findMessagesBetweenUsers', { senderName: name.value, recipientName: user.name }, (response) => {
    messages.value = response;
  });
};
</script>

<template>
  <div class="chat">
    <div v-if="!nameEntered" class="join-container">
      <form @submit.prevent="enterName" class="join-form">
        <label>What's your name?</label>
        <input v-model="name" class="input" />
        <button type="submit" class="button">Enter</button>
      </form>
    </div>

    <div v-else>
      <div v-if="!joined && !privateMessageRecipient" class="online-users-container">
        <h3>Online Users</h3>
        <div v-for="(user, index) in onlineUsers" :key="index" class="online-user" @click="selectPrivateMessageRecipient(user)">
          {{ user.name }}
        </div>
        <div class="room-join">
          <label>Select Room:</label>
          <select v-model="selectedRoom" class="select">
            <option value="room1">Room 1</option>
            <option value="room2">Room 2</option>
            <option value="room3">Room 3</option>
            <option value="room4">Room 4</option>
          </select>
          <button @click="joinRoom" class="button">Join Room</button>
        </div>
      </div>

      <div v-else class="chat-container">
        <div class="messages-container">
          <div v-for="message in messages" :key="message.id" class="message">
            <strong v-if="message.senderName === name.value">Me:</strong>
            <strong v-else>[{{ message.senderName }}]:</strong>
            {{ message.text }}
          </div>
        </div>
        <div v-if="typingDisplay" class="typing-display">
          {{ typingDisplay }}
        </div>
        <div class="message-input">
          <form @submit.prevent="sendMessage" class="message-form">
            <label>Message:</label>
            <input v-model="messageText" @input="emitTyping" class="input" />
            <button type="submit" class="button">Send</button>
          </form>
        </div>
        <div class="room-change" v-if="joined">
          <label>Change Room:</label>
          <select v-model="selectedRoom" class="select">
            <option value="room1">Room 1</option>
            <option value="room2">Room 2</option>
            <option value="room3">Room 3</option>
            <option value="room4">Room 4</option>
          </select>
          <button @click="changeRoom" class="button">Change Room</button>
        </div>
        <div class="notifications" v-if="notifications.length">
          <h3>Notifications</h3>
          <div v-for="(notification, index) in notifications" :key="index" class="notification">
            New message from {{ notification.from }}: {{ notification.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* CSS styles for the chat component */

.chat {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #2c2c2c;
  color: #ffffff;
}

.join-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.join-form {
  display: flex;
  flex-direction: column;
  background: #444444;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  color: white;
}

.input, .select {
  margin: 10px 0;
  padding: 10px;
  border: none;
  border-radius: 5px;
  background-color: #333333;
  color: #ffffff;
}

.button {
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.button:hover {
  background-color: #0056b3;
}

.online-users-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.online-user {
  cursor: pointer;
  padding: 10px;
  background-color: #444444;
  border-radius: 5px;
  margin-bottom: 10px;
  color: #ffffff;
}

.online-user:hover {
  background-color: #555555;
}

.room-join {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 600px;
  background: #333333;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  color: #ffffff;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #555555;
  border-radius: 5px;
  margin-bottom: 10px;
  background: #2c2c2c;
}

.message {
  margin-bottom: 10px;
  background-color: #444444;
  padding: 5px;
  border-radius: 5px;
}

.typing-display {
  margin-bottom: 10px;
  color: #888;
}

.message-input {
  margin-bottom: 10px;
}

.message-form {
  display: flex;
  align-items: center;
}

.message-form .input {
  flex: 1;
  margin-right: 10px;
}

.room-change {
  margin-bottom: 10px;
}

.notifications {
  margin-top: 10px;
  background-color: #444444;
  padding: 10px;
  border-radius: 5px;
}

.notification {
  margin-bottom: 5px;
  background-color: #555555;
  padding: 5px;
  border-radius: 5px;
}
</style>
