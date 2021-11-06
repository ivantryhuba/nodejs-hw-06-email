const Mailgen = require('mailgen');

class EmailService {
  constructor(env, sender) {
    this.sender = sender;

    switch (env) {
      case 'devalopment':
        this.link = 'http://7cdc-185-19-6-75.ngrok.io';
        break;

      case 'production':
        this.link = 'link for production';
        break;

      default:
        this.link = 'http://7cdc-185-19-6-75.ngrok.io';
        break;
    }
  }

  createTemplateEmail(name, verifyToken) {
    const mailGenerator = new Mailgen({
      theme: 'cerberus',
      product: {
        name: 'Brazzers',
        link: this.link,
      },
    });
    const email = {
      body: {
        name,
        intro: "Welcome to Brazzers! We're very excited to have you on board.",
        action: {
          instructions: 'To get started with Brazzers, please click here:',
          button: {
            color: '#22BC66', // Optional action button color
            text: 'Confirm your account',
            link: `${this.link}/api/users/verify/${verifyToken}`,
          },
        },
        outro:
          "Need help, or have questions? Just reply to this email, we'd love to help.",
      },
    };

    return mailGenerator.generate(email);
  }

  async sendVerifyEmail(email, name, verifyToken) {
    const emailHTML = this.createTemplateEmail(name, verifyToken);

    const message = {
      to: email,
      subject: 'Verify Your Email',
      html: emailHTML,
    };
    try {
      const result = await this.sender.send(message);
      console.log(result);
      return true;
    } catch (error) {
      console.log(error.message);
      return false;
    }
  }
}

module.exports = EmailService;
