import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { getRecieverSocketId, io } from "../socket/socket.js";

//controller for chat system in the app
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;
    const { textMessage:message } = req.body;
    // console.log(message)

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    //establish conversation if not started yet

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
    });

    if (newMessage) conversation.messages.push(newMessage._id);
    await Promise.all([conversation.save(), newMessage.save()]); //to handle more than one collection multiple time.

    //implement socket io for real time data transfer
    const recieverSocketId = getRecieverSocketId(receiverId);
    if(recieverSocketId){
      io.to(recieverSocketId).emit('newMessage',newMessage);
    }


    return res.status(201).json({
      success: true,
      newMessage,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate('messages');

    if (!conversation)
      return res.status(200).json({ messages: [], success: true });

    return res
      .status(200)
      .json({ messages: conversation?.messages, success: true });

    //const messages = await Message.find({conversationId:conversation._id}).sort({createdAt:-1})
  } catch (error) {
    console.log(error);
  }
};
