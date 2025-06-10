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

// ✅ Get All Messages Between Sender and Receiver
export const getMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate("messages");

    if (!conversation) {
      return res.status(200).json({
        success: true,
        messages: [],
      });
    }

    return res.status(200).json({
      success: true,
      messages: conversation.messages || [],
    });
  } catch (error) {
    console.error("Error in getMessage:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};



// ✅ React to a Message with Emoji

// React to a Message with Emoji (Add or Update user's reaction)
export const reactToMessage = async (req, res) => {
  try {
    const userId = req.id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: "Emoji is required",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Find if this user already reacted to this message
    const existingReactionIndex = message.reactions.findIndex(
      (reaction) => reaction.reactedBy.toString() === userId
    );

    if (existingReactionIndex > -1) {
      // Update the existing reaction emoji
      message.reactions[existingReactionIndex].emoji = emoji;
    } else {
      // Add new reaction
      message.reactions.push({ emoji, reactedBy: userId });
    }

    await message.save();

    // Emit real-time update to receiver (and optionally sender)
    const receiverSocketId = getRecieverSocketId(message.receiverId.toString());
    const senderSocketId = getRecieverSocketId(message.senderId.toString());

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReaction", message);
    }
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("messageReaction", message);
    }

    return res.status(200).json({
      success: true,
      message: "Reaction added/updated successfully",
      updatedMessage: message,
    });
  } catch (error) {
    console.error("Error in reactToMessage:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to react to message",
    });
  }
};

