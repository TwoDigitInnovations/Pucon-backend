const User = require("../models/user");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userController = {

  // login: (req, res) => {
  //   console.log("request came here");
  //   passport.authenticate("local", async (err, user) => {

  //     console.log('AAAAA', err)
  //     console.log('DDDDDDD', user)

  //     if (err) {
  //       // return response.error(res, err);
  //       res.status(500).json({ success: false, message: "Server error" });
  //     }
  //     if (!user) {
  //       // return response.unAuthorize(res, info);
  //       return res.status(401).json({ success: false, message: "No token provided" });
  //     }
  //     let token = await new jwtService().createJwtToken({
  //       id: user._id,
  //       // user: user.fullName,
  //       type: user.type,
  //       tokenVersion: new Date(),
  //     });
  //     await user.save();
  //     let data = {
  //       token,
  //       ...user._doc,
  //     };
  //     delete data.password;
  //     // return response.ok(res, { ...data });
  //     return res.status(200).json({
  //       success: true,
  //       // message: "Super Categories fetched successfully",
  //       data,
  //     });
  //   })(req, res);
  // },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          token,
          type: user.type,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  signUp: async (req, res) => {
    try {
      const payload = req.body;
      const mail = req.body.email;
      if (!mail) {
        // return response.badReq(res, { message: "Email required." });
        return res.status(400).json({
          success: true,
          message: "Email required.",
        });
      }
      let user2 = await User.findOne({
        email: payload.email.toLowerCase(),
      });
      console.log(user2)
      // const user = await User.findOne({ email: payload.email });
      // console.log(user)
      // if (user) {
      //   return res.status(404).json({
      //     success: false,
      //     message: "Phone number already exists.",
      //   });
      // }
      if (user2) {
        return res.status(404).json({
          success: false,
          message: "Email Id already exists.",
        });
      } else {
        let user = new User({
          username: payload?.username,
          email: payload?.email,
          // number: payload?.number,
          type: payload?.type
        });
        user.password = user.encryptPassword(req.body.password);
        await user.save();
        await mailNotification.welcomeMail(user)
        res.status(200).json({ success: true, data: user });
      }
    } catch (error) {
      // return response.error(res, error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

};

module.exports = userController;
