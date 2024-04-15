import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

let onlineUsers = [];
let notifications = [];
const findUser = userID => {
  return onlineUsers.find(user => user.id === userID);
};
const findNotification = (postID, type, senderID) => {
  const item = notifications.find(notification => {
    if (
      notification.postID === postID &&
      notification.type === type &&
      notification.senderID === senderID
    )
      return true;
    return false;
  });
  return item;
};
const addUser = async (userID, socketID) => {
  const user = findUser(userID);
  if (!user) {
    onlineUsers.push({ id: userID, socketID });
  }
};
const getUserNotifications = async userID => {
  return notifications.filter(
    notification => notification.receiverID === userID
  );
};
const addNotification = async (postID, type, messege, senderID, receiverID) => {
  const notification = findNotification(postID, type, senderID);
  if (notification) {
    console.log('notification exists');
    return false;
  }
  notifications.push({ postID, type, messege, senderID, receiverID });
  console.log('notification added');
  return true;
};
const removeUser = async socketID => {
  onlineUsers = onlineUsers.filter(user => user.socketID !== socketID);
  console.log('a user removed', onlineUsers);
};

io.on('connection', socket => {
  //ask for the details of the users
  socket.emit('SEND_DETAILS');

  //add the user to online users
  socket.on('ADD_USER', userID => {
    addUser(userID, socket.id).then(() => {
      console.log('a user added', onlineUsers);
      // give the added user the users that are online. using io because we want to update online users for all connected users
      io.emit('GET_ONLINE_USERS', onlineUsers);

      //send user notifications
      getUserNotifications(userID).then(notifications => {
        socket.emit('GET_NOTIFICATIONS', notifications);
      });
    });
  });

  socket.on(
    'ADD_NOTIFICATION',
    (postID, username, type, senderID, receiverID) => {
      let messege = '';
      switch (type) {
        case 1:
          messege = `${username} liked your post`;
          break;
        default:
          messege = `default messege`;
      }
      addNotification(postID, type, messege, senderID, receiverID).then(
        results => {
          if (results) {
            //send notification if the user is online
            const user = findUser(receiverID);
            if (user) {
              const notifications = getUserNotifications(receiverID);
              io.to(user.socketID).emit('GET_NOTIFICATIONS', notifications);
            }
          } else {
            console.log('user is offline');
          }
        }
      );
    }
  );
  socket.on('SEND_MESSEGE', (messege, receiverID) => {
    const user = findUser(receiverID);
    //send the messege if the other user is online
    if (user) {
      io.to(user.socketID).emit('RECEIVE_MESSEGE', messege);
      //   console.log('user is online');
    } else {
      //   console.log('user is offline');
    }
  });
  socket?.on('TYPING', (receiverID, roomID) => {
    const user = findUser(receiverID);
    //send the typing activity if the other user is online
    if (user) {
      io.to(user.socketID).emit('FRIEND_TYPING', roomID);
    } else {
      console.log('user is offline');
    }
  });
  socket?.on('STOP_TYPING', (receiverID, roomID) => {
    const user = findUser(receiverID);
    //send the typing activity if the other user is online
    if (user) {
      io.to(user.socketID).emit('FRIEND_STOPED_TYPING', roomID);
    } else {
      console.log('user is offline');
    }
  });
  console.log('a user is connected');
  socket.on('disconnect', () => {
    removeUser(socket.id).then(() => {
      console.log('a user is disconnected');
      io.emit('GET_ONLINE_USERS', onlineUsers);
    });
  });
});

const port = 7000 || process.env.PORT;
server.listen(port, () =>
  console.log(`socket server listening on port ${port}...`)
);
