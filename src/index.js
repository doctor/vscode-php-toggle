const vscode = require("vscode");

const php_regex = /<\?(php|=)?\s.*\?>/g;
const php_opener_regex = /<\?(php|=)?/g;
const php_closer_regex = /\?>/g;

const php_blocks = [
  ["<?=", "?>"],
  ["<?php", "?>"],
];

function activate(context) {
  const subs = context.subscriptions;

  subs.push(
    vscode.commands.registerCommand("php-toggle.toggleTags", function () {
      let editor = vscode.window.activeTextEditor;
      if (editor) {
        toggleTags(editor);
      }
    })
  );
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;

function findSorroundingTags(text) {
  return [text.match(php_opener_regex)[0], text.match(php_closer_regex)[0]];
}

function insertPhpTags(text) {
  return `${php_blocks[0][0]} ${text} ${php_blocks[0][1]}`;
}

function replacePhpTags(text) {
  let tags = findSorroundingTags(text);
  let next_tags = getNextPhpTags(tags);
  return text.replace(tags[0], next_tags[0]).replace(tags[1], next_tags[1]);
}

function getNextPhpTags(tags) {
  let tags_str = JSON.stringify(tags);
  for (let i = 0; i < php_blocks.length; i++) {
    if (JSON.stringify(php_blocks[i]) == tags_str) {
      if (i + 1 >= php_blocks.length) {
        return php_blocks[0];
      } else {
        return php_blocks[i + 1];
      }
    }
  }

  return php_blocks[0];
}

function getSelectionRange(selection, editor) {
  let line = editor.document.lineAt(selection.start);
  let selected_text = editor.document.getText(selection);
  let new_selection = new vscode.Selection(selection.start, selection.end);
  let start_position = new_selection.start;
  let end_position = new_selection.end;
  let opener_position = [];
  let closer_position = [];

  while (start_position.character > line.firstNonWhitespaceCharacterIndex) {
    start_position = new vscode.Position(
      line.lineNumber,
      new_selection.start.character - 1
    );
    new_selection = new vscode.Selection(start_position, end_position);

    if (editor.document.getText(new_selection).match(php_opener_regex)) {
      opener_position.push(start_position);
      break;
    }
  }
  while (end_position.character < line.range.end.character) {
    end_position = new vscode.Position(
      line.lineNumber,
      new_selection.end.character + 1
    );
    new_selection = new vscode.Selection(start_position, end_position);
    if (editor.document.getText(new_selection).match(php_closer_regex)) {
      closer_position.push(end_position);
      break;
    }
  }

  if (opener_position.length > 0 && closer_position.length > 0) {
    return new vscode.Range(new_selection.start, new_selection.end);
  } else if (
    selection.isEmpty &&
    editor.document.getText(selection).trim().length === 0 &&
    line.isEmptyOrWhitespace
  ) {
    start_position = new vscode.Position(
      selection.start.line,
      line.firstNonWhitespaceCharacterIndex
    );
    end_position = line.range.end;
    return new vscode.Range(start_position, end_position);
  }

  return new vscode.Range(selection.start, selection.end);
}

function toggleTags(editor) {
  let selections_map = {};
  let new_selections = [];
  let line_offset = 0;
  let selections = editor.selections.filter(function (selection) {
    return selection.isSingleLine;
  });

  // Push selections to selections_map grouped by line
  selections.forEach(function (selection) {
    return selections_map[selection.start.line]
      ? selections_map[selection.start.line].push(selection)
      : (selections_map[selection.start.line] = [selection]);
  });

  editor.edit(function (editBuilder) {
    for (let key in selections_map) {
      if (selections_map.hasOwnProperty(key)) {
        line_offset = 0;
        // Order selections by ltr position
        selections_map[key] = selections_map[key].sort(function (
          first,
          second
        ) {
          return first.end.isBefore(second.start) ? -1 : 1;
        });

        selections_map[key].forEach(function (selection) {
          let selectedRange = getSelectionRange(selection, editor);
          let selected_text = editor.document.getText(selectedRange);
          let new_text;
          let new_selection;
          if (selected_text.match(php_regex)) {
            new_text = replacePhpTags(selected_text);
          } else {
            new_text = insertPhpTags(selected_text);
          }
          let delta = new_text.length - selected_text.length;
          if (selected_text.trim().length == 0) {
            if (new_text.startsWith("<?=")) {
              new_selection = new vscode.Selection(
                selection.start.line,
                selection.end.character + delta - 3,
                selection.end.line,
                selection.end.character + delta - 3
              );
            } else {
              new_selection = new vscode.Selection(
                selection.start.line,
                selection.end.character + delta - 7,
                selection.end.line,
                selection.end.character + delta - 3
              );
            }
          } else {
            new_selection = new vscode.Selection(
              selection.start.line,
              selection.start.character + line_offset,
              selection.end.line,
              selection.end.character + line_offset + delta
            );
          }
          new_selections.push(new_selection);
          line_offset += delta;
          editBuilder.replace(selectedRange, new_text);
        });
      }
    }
  });
  editor.selections = new_selections;
}
