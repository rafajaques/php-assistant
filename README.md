<p align="center">
  <img src="https://raw.githubusercontent.com/rafajaques/php-assistant/master/gfx/readme/logo.png" alt="PHP Assistant Logo"/>
</p>

[![Build Status](https://travis-ci.org/rafajaques/php-assistant.svg?branch=master)](https://travis-ci.org/rafajaques/php-assistant)
[![Dependency Status](https://david-dm.org/rafajaques/php-assistant.svg)](https://david-dm.org/rafajaques/php-assistant)
[![devDependency Status](https://david-dm.org/rafajaques/php-assistant/dev-status.svg)](https://david-dm.org/rafajaques/php-assistant#info=devDependencies)

PHP Assistant is a cross-platform desktop app for testing PHP snippets.
Built with Electron, Node.js and HTML5/CSS/JS.
The main goal is to have a simple app to test small pieces of code without having to search for a sandbox, creating a file or opening the terminal.

<p align="center">
  <img src="https://raw.githubusercontent.com/rafajaques/php-assistant/master/gfx/readme/screenshot.png" alt="ScreenShot"/>
</p>

## Download

Get the most recent release at [releases](https://github.com/rafajaques/php-assistant/releases).

## Building

You'll need [Node.js](https://nodejs.org) installed on your computer in order to build this app.

```bash
$ git clone https://github.com/rafajaques/php-assistant/
$ cd php-assistant
$ npm install
$ npm start
```

If you don't wish to clone, you can [download the source code](https://github.com/rafajaques/php-assistant/archive/master.zip).

For easier developing you can launch the app maximized with DevTools open:

```bash
$ npm run dev
```

## Issues

If you have any problems with the app or if you have any suggestions, just open an [issue](https://github.com/rafajaques/php-assistant/issues).

## Translation

The app was released in English, Brazilian Portuguese and French.
So far, with community help, we have: French (@Johann-S), Danish (@peterbrinck), German (@ingowalther).

To translate you need to fork master branch.

In the folder `locales` you will find json files with the app strings.
Copy `en.json` file and rename it as the [language code provided by ISO](http://www.lingoes.net/en/translator/langcode.htm).

Translate the strings (the ones on the right side) and insert a reference into the list (locales variable) in `main.js` file.

After that, just send a pull request. In advance, I say thank you!

## Author

Feel free to text me on Twitter: [@rafajaques](https://twitter.com/rafajaques)
