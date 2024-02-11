# VSCode PHP Toggle

This extensions provides toggle command for PHP tags in VSCode.

Command:

```
php-toggle.toggleTags
```

## Features

- Cycles through tags `<?php ?>` and `<?= ?>`
- Multiline support
- Works in `php`, `html.php`

## Keyboard shortcuts

MacOS: `Command+Shift+/`

Windows & Linux: `Ctrl+Shift+/`

To customize keyboard shortcuts:

```
{
  "command": "php-toggle.toggleTags",
  "key": "ctrl+shift+/",
  "when": "editorTextFocus && editorLangId =~ /php/"
},
```

## Credits

Inspired by [@kirillplatonov](https://github.com/kirillplatonov) plugin [vscode-erb-toggle](https://github.com/kirillplatonov/vscode-erb-toggle).

## License

This extension is [licensed under the MIT License](LICENSE.txt).
