<?php
/**
 * Emporium Capitals — Universal SQL Statement Splitter
 *
 * Splits .sql files into individual statements, correctly respecting:
 * - Single quotes ('...') and escaped quotes ('')
 * - Double quotes ("...")
 * - Backticks (`...`) for MySQL identifiers
 * - PostgreSQL dollar-quoting ($$...$$ or $body$...$body$)
 * - Line comments (-- and #)
 * - Block comments (/* ... * /)
 *
 * Compatible with MySQL, MariaDB, and PostgreSQL.
 */

function splitStatements($sql) {
    $statements = array();
    $current = '';
    $len = strlen($sql);
    $i = 0;
    $inSingle = false;
    $inDouble = false;
    $inBacktick = false;
    $dollarTag = null;

    while ($i < $len) {
        // Block comment /* ... */
        if (!$inSingle && !$inDouble && !$inBacktick && $dollarTag === null
            && $sql[$i] === '/' && $i + 1 < $len && $sql[$i + 1] === '*') {
            $i += 2;
            while ($i + 1 < $len && !($sql[$i] === '*' && $sql[$i + 1] === '/')) {
                $i++;
            }
            $i += 2;
            continue;
        }

        // Line comment -- or #
        if (!$inSingle && !$inDouble && !$inBacktick && $dollarTag === null) {
            if (($sql[$i] === '-' && $i + 1 < $len && $sql[$i + 1] === '-') || $sql[$i] === '#') {
                while ($i < $len && $sql[$i] !== "\n") {
                    $i++;
                }
                continue;
            }
        }

        // Dollar-quote open/close, e.g. $$ ... $$ or $body$ ... $body$ (PostgreSQL)
        if (!$inSingle && !$inDouble && !$inBacktick && $sql[$i] === '$'
            && preg_match('/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/', substr($sql, $i), $m)) {
            $tag = $m[0];
            if ($dollarTag === null) {
                $dollarTag = $tag;
            } elseif ($dollarTag === $tag) {
                $dollarTag = null;
            }
            $current .= $tag;
            $i += strlen($tag);
            continue;
        }

        // Backticks for MySQL identifiers
        if ($dollarTag === null && !$inSingle && !$inDouble && $sql[$i] === '`') {
            $inBacktick = !$inBacktick;
            $current .= '`';
            $i++;
            continue;
        }

        // Single quotes
        if ($dollarTag === null && !$inDouble && !$inBacktick && $sql[$i] === "'") {
            // Escaped single quote
            if ($inSingle && $i + 1 < $len && $sql[$i + 1] === "'") {
                $current .= "''";
                $i += 2;
                continue;
            }
            // Backslash escape in MySQL
            if ($inSingle && $i > 0 && $sql[$i - 1] === '\\' && !($i > 1 && $sql[$i - 2] === '\\')) {
                $current .= "'";
                $i++;
                continue;
            }
            $inSingle = !$inSingle;
        } elseif ($dollarTag === null && !$inSingle && !$inBacktick && $sql[$i] === '"') {
            $inDouble = !$inDouble;
        }

        // Statement separator
        if ($sql[$i] === ';' && !$inSingle && !$inDouble && !$inBacktick && $dollarTag === null) {
            $stmt = trim($current);
            if ($stmt !== '') {
                $statements[] = $stmt;
            }
            $current = '';
            $i++;
            continue;
        }

        $current .= $sql[$i];
        $i++;
    }

    $stmt = trim($current);
    if ($stmt !== '') {
        $statements[] = $stmt;
    }
    return $statements;
}
