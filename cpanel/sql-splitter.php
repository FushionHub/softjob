<?php
/**
 * Emporium Capitals — shared SQL statement splitter (NEW FILE).
 *
 * Splits .sql text into individual statements, respecting single/double
 * quotes, line comments and dollar-quoting. Used by db-install.php and by
 * CLI verification harnesses. No project code is modified.
 */

function splitStatements($sql) {
    $statements = array();
    $current = '';
    $len = strlen($sql);
    $i = 0;
    $inSingle = false;
    $inDouble = false;
    $dollarTag = null;

    while ($i < $len) {
        // Line comment outside strings/tags: skip to end of line.
        if (!$inSingle && !$inDouble && $dollarTag === null
            && $sql[$i] === '-' && $i + 1 < $len && $sql[$i + 1] === '-') {
            while ($i < $len && $sql[$i] !== "\n") { $i++; }
            continue;
        }
        // Dollar-quote open/close, e.g. $$ ... $$ or $body$ ... $body$.
        if (!$inSingle && !$inDouble && $sql[$i] === '$'
            && preg_match('/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/', substr($sql, $i), $m)) {
            $tag = $m[0];
            if ($dollarTag === null) { $dollarTag = $tag; }
            elseif ($dollarTag === $tag) { $dollarTag = null; }
            $current .= $tag;
            $i += strlen($tag);
            continue;
        }
        if ($dollarTag === null && !$inDouble && $sql[$i] === "'") {
            // '' is an escaped quote inside a string.
            if ($inSingle && $i + 1 < $len && $sql[$i + 1] === "'") {
                $current .= "''";
                $i += 2;
                continue;
            }
            $inSingle = !$inSingle;
        } elseif ($dollarTag === null && !$inSingle && $sql[$i] === '"') {
            $inDouble = !$inDouble;
        }
        if ($sql[$i] === ';' && !$inSingle && !$inDouble && $dollarTag === null) {
            $stmt = trim($current);
            if ($stmt !== '') { $statements[] = $stmt; }
            $current = '';
            $i++;
            continue;
        }
        $current .= $sql[$i];
        $i++;
    }
    $stmt = trim($current);
    if ($stmt !== '') { $statements[] = $stmt; }
    return $statements;
}
