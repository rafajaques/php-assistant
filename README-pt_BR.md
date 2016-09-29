<p align="center">
  <img width="200" src="https://raw.githubusercontent.com/rafajaques/php-assistant/master/app/gfx/readme/logo.png" alt="PHP Assistant Logo"/>
</p>


[![Travis Build Status](https://travis-ci.org/rafajaques/php-assistant.svg?branch=master)](https://travis-ci.org/rafajaques/php-assistant)
[![Appveyor Build status](https://ci.appveyor.com/api/projects/status/r4wsabo0ury7a5kg?svg=true)](https://ci.appveyor.com/project/rafajaques/php-assistant)
[![Latest release](https://img.shields.io/github/tag/rafajaques/php-assistant.svg)](https://github.com/rafajaques/php-assistant/releases)
[![Dependency Status](https://david-dm.org/rafajaques/php-assistant.svg?path=app)](https://david-dm.org/rafajaques/php-assistant?path=app)
[![devDependency Status](https://david-dm.org/rafajaques/php-assistant/dev-status.svg)](https://david-dm.org/rafajaques/php-assistant#info=dev)
[![license:mit](https://img.shields.io/badge/license-mit-blue.svg)](https://opensource.org/licenses/MIT)

O PHP Assistant é um aplicativo desktop multiplataforma para testar trechos de código PHP.
Ele foi construído com o Electron, Node.js e HTML5/CSS/JS.
Seu objetivo principal é ser um aplicativo simples para testar pequenos trechos de código sem precisar se preocupar com nenhuma sandbox, criar arquivos nem abrir o terminal.

<p align="center">
  <img src="https://raw.githubusercontent.com/rafajaques/php-assistant/master/app/gfx/readme/screenshot.png" alt="ScreenShot"/>
</p>

## Download

Você encontrará as versões mais recentes aqui. Lembre-se que o PHP Assistant ainda está em desenvolvimento, por isso você pode encontrar bugs durante seu uso. Em caso de problemas, abra uma [issue](https://github.com/rafajaques/php-assistant/issues).

[![Mac OSX Download](https://img.shields.io/badge/download-Mac%20OSX-blue.svg)](https://github.com/rafajaques/php-assistant/releases/download/v0.0.11/phpassistant-0.0.11.dmg)
[![Debian/Ubuntu/Mint 32](https://img.shields.io/badge/download-Debian%2FUbuntu%2FMint%20(32)-blue.svg)](https://github.com/rafajaques/php-assistant/releases/download/v0.0.11/phpassistant-0.0.11-ia32.deb)
[![Debian/Ubuntu/Mint 64](https://img.shields.io/badge/download-Debian%2FUbuntu%2FMint%20(64)-blue.svg)](https://github.com/rafajaques/php-assistant/releases/download/v0.0.11/phpassistant-0.0.11.deb)
[![Windows 32 Download](https://img.shields.io/badge/download-Windows%20(32)-blue.svg)](https://github.com/rafajaques/php-assistant/releases/download/v0.0.11/phpassistant-Setup-0.0.11-ia32.exe)
[![Windows 64 Download](https://img.shields.io/badge/download-Windows%20(64)-blue.svg)](https://github.com/rafajaques/php-assistant/releases/download/v0.0.11/phpassistant-Setup-0.0.11.exe)

## Compilação

Você precisará do [Node.js](https://nodejs.org) instalado no seu computador para compilar esse aplicativo.

```bash
$ git clone https://github.com/rafajaques/php-assistant/
$ cd php-assistant
$ npm install
$ npm start
```
Caso não queira fazer o clone, você pode [baixar o código fonte](https://github.com/rafajaques/php-assistant/archive/master.zip).

Para facilitar o desenvolvimento, você pode iniciar o aplicativo maximizado com o DevTools:

```bash
$ npm run dev
```

## Issues

Se você tiver qualquer problema ou em caso de sugestões sobre o aplicativo , abra uma [issue](https://github.com/rafajaques/php-assistant/issues).

## Tradução

O aplicativo foi lançado em inglês, português do Brasil e francês.
No momento, com a ajuda da comunidade, já temos: francês (@Johann-S), dinamarquês (@peterbrinck) e alemão (@ingowalther).

Para traduzir você precisa fazer um fork do branch master.

Na pasta `locales` você irá encontrar os arquivos json com as strings do aplicativo.
Copie o arquivo `en.json` e renomeie-o para o [código de idioma fornecido pela ISO](http://www.lingoes.net/en/translator/langcode.htm).

Traduza as strings (que estão do lado direito do arquivo) e insira uma referência na lista (locales variable) no arquivo `main.js`.

Depois disso, é só mandar um pull request. Antecipadamente, um muito obrigado!

## Autor

Fique à vontade para conversar comigo no Twitter: [@rafajaques](https://twitter.com/rafajaques)

## Agradecimentos

Esse projeto não seria possível sem sua ajuda.

- [@germanocorrea](https://github.com/germanocorrea)
- [@Johann-S](https://github.com/johann-s)
