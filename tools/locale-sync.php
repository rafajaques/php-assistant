#!/usr/bin/env php
<?php
echo "Syncing locale files...\n";

$base = 'app/locales/';

if (!file_exists($base . 'pt-BR.json'))
  die("Could not find pt-BR.json\n");

$orig = json_decode(file_get_contents($base . 'pt-BR.json'), true);
#print_r($orig);

$iterator = new RecursiveDirectoryIterator($base);
$recursiveIterator = new RecursiveIteratorIterator($iterator);
foreach ($recursiveIterator as $entry) {
    $fname = $entry->getPathname();
    if (!in_array(basename($fname), ['.', '..', 'pt-BR.json'])) {
      $toUpdate = json_decode(file_get_contents($fname), true);

      foreach ($orig as $k => $v) {
        if (!isset($toUpdate[$k]))
          $toUpdate[$k] = $k;
      }

      $output = json_encode($toUpdate, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
      $output = str_replace('    ', '	', $output);

      file_put_contents($fname, $output);

      echo basename($fname)." [OK]\n";
    }
}

echo "All files synced\n";
