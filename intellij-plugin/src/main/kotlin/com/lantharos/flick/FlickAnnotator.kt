package com.lantharos.flick

import com.intellij.lang.annotation.AnnotationHolder
import com.intellij.lang.annotation.Annotator
import com.intellij.lang.annotation.HighlightSeverity
import com.intellij.openapi.editor.DefaultLanguageHighlighterColors
import com.intellij.psi.PsiElement

// Built-in functions that should be highlighted
val BUILTIN_FUNCTIONS: Set<String> = setOf(
    "print", "ask", "num", "str", "read", "write", "exists",
    "sleep", "now", "random", "randint", "shuffle", "choice"
)

// Plugin-specific keywords and functions
val WEB_PLUGIN_KEYWORDS: Set<String> = setOf("route", "respond", "GET", "POST", "PUT", "DELETE", "PATCH")
val DB_PLUGIN_KEYWORDS: Set<String> = setOf("query", "execute", "transaction", "connect")
val FILE_PLUGIN_KEYWORDS: Set<String> = setOf("read", "write", "exists", "listdir")

// Map plugins to their keywords
val PLUGIN_KEYWORDS: Map<String, Set<String>> = mapOf(
    "web" to WEB_PLUGIN_KEYWORDS,
    "db" to DB_PLUGIN_KEYWORDS,
    "file" to FILE_PLUGIN_KEYWORDS
)

class FlickAnnotator : Annotator {

    override fun annotate(element: PsiElement, holder: AnnotationHolder) {
        if (element.containingFile.fileType != FlickFileType) return

        val text = element.text.trim()
        val file = element.containingFile
        val fileText = file.text

        // Get declared plugins from the file
        val declaredPlugins = getDeclaredPlugins(fileText)

        // Check for element-specific issues
        when {
            // Unclosed strings
            element.text.startsWith("\"") && !element.text.endsWith("\"") && element.text.length > 1 -> {
                holder.newAnnotation(HighlightSeverity.ERROR, "Unclosed string")
                    .range(element)
                    .create()
            }

            // Invalid variable names
            text.matches(Regex("\\d+[a-zA-Z_].*")) -> {
                holder.newAnnotation(HighlightSeverity.ERROR, "Variable names cannot start with a number")
                    .range(element)
                    .create()
            }

            // Check for "end" keyword - validate it has a matching block
            text == "end" -> {
                checkEndStatement(element, holder)
            }

            // Check for block-starting keywords
            text in listOf("task", "route", "assume", "maybe", "otherwise", "each", "march", "group", "select", "suppose", "do", "when") -> {
                checkBlockStart(element, holder)
            }

            // Highlight built-in functions (like ask, print, etc.)
            text in BUILTIN_FUNCTIONS -> {
                holder.newAnnotation(HighlightSeverity.INFORMATION, "")
                    .range(element)
                    .textAttributes(DefaultLanguageHighlighterColors.PREDEFINED_SYMBOL)
                    .create()
            }

            // Highlight function calls (lowercase identifiers followed by arguments)
            isFollowedByArguments(element) && isFunctionName(text) && text !in BUILTIN_FUNCTIONS -> {
                holder.newAnnotation(HighlightSeverity.INFORMATION, "")
                    .range(element)
                    .textAttributes(DefaultLanguageHighlighterColors.FUNCTION_CALL)
                    .create()
            }

            // Highlight class/group names (capitalized identifiers)
            text.matches(Regex("[A-Z][a-zA-Z0-9_]*")) -> {
                holder.newAnnotation(HighlightSeverity.INFORMATION, "")
                    .range(element)
                    .textAttributes(DefaultLanguageHighlighterColors.CLASS_NAME)
                    .create()
            }

            // Check for plugin-specific keywords without declaration
            else -> {
                checkPluginSpecificKeyword(text, declaredPlugins, element, holder)
                checkVariableIssues(element, text, fileText, holder)
            }
        }
    }

    private fun checkEndStatement(element: PsiElement, holder: AnnotationHolder) {
        val fileText = element.containingFile.text
        val offset = element.textRange.startOffset

        // Get text before this end statement
        val textBefore = fileText.substring(0, offset)

        // Remove comments to avoid counting keywords in comments
        val textWithoutComments = textBefore.lines().joinToString("\n") { line ->
            val commentIndex = line.indexOf('#')
            if (commentIndex >= 0) line.substring(0, commentIndex) else line
        }

        // Track block depth
        var blockDepth = 0
        // Block starters: task, route, each, march, group, assume, select, suppose, do
        // Continuations: maybe, otherwise, when (don't start new blocks)
        val blockPattern = Regex("""(task|route|assume|each|march|group|select|suppose|do)\b.*=>|(maybe|otherwise|when)\b.*=>|\bend\b""")

        blockPattern.findAll(textWithoutComments).forEach { match ->
            val matchText = match.value.trim()
            when {
                matchText == "end" -> blockDepth--
                matchText.startsWith("maybe") || matchText.startsWith("otherwise") || matchText.startsWith("when") -> {
                    // These don't increase depth, they're continuations
                }
                else -> blockDepth++ // task, route, assume, each, march, group, select, suppose, do
            }
        }

        // If blockDepth is negative, this end has no matching block
        if (blockDepth < 0) {
            holder.newAnnotation(HighlightSeverity.ERROR, "Unexpected 'end' statement without matching block")
                .range(element)
                .create()
        }
    }

    private fun checkBlockStart(element: PsiElement, holder: AnnotationHolder) {
        val fileText = element.containingFile.text
        val offset = element.textRange.startOffset

        // Look for => after this keyword on the same or next line
        val textAfter = fileText.substring(offset)
        val nextLines = textAfter.split("\n").take(2).joinToString("\n")

        if (!nextLines.contains("=>")) {
            return // Not a block start, just the keyword
        }

        // maybe, otherwise, and when are continuations, not new blocks
        if (element.text.trim() in listOf("maybe", "otherwise", "when")) {
            return
        }

        // Find the matching end for this block
        val textAfterArrow = textAfter.substringAfter("=>")
        var blockDepth = 1
        var foundEnd = false

        // Block starters: task, route, each, march, group, assume, select, suppose, do
        // Continuations: maybe, otherwise, when (don't increase depth)
        val blockPattern = Regex("""(task|route|assume|each|march|group|select|suppose|do)\b.*=>|(maybe|otherwise|when)\b.*=>|\bend\b""")
        blockPattern.findAll(textAfterArrow).forEach { match ->
            val matchText = match.value.trim()
            when {
                matchText == "end" -> {
                    blockDepth--
                    if (blockDepth == 0) {
                        foundEnd = true
                        return@forEach
                    }
                }
                matchText.startsWith("maybe") || matchText.startsWith("otherwise") || matchText.startsWith("when") -> {
                    // These don't increase depth
                }
                else -> blockDepth++ // task, route, assume, each, march, group, select, suppose, do
            }
        }

        if (!foundEnd) {
            holder.newAnnotation(
                HighlightSeverity.ERROR,
                "Missing 'end' statement for '${element.text}' block"
            )
                .range(element)
                .create()
        }
    }

    private fun checkVariableIssues(element: PsiElement, text: String, fileText: String, holder: AnnotationHolder) {
        // Check for duplicate variable declarations
        if (text.matches(Regex("[a-zA-Z_][a-zA-Z0-9_]*"))) {
            val varPattern = Regex("""(?:free|lock)\s+(?:num\s+|literal\s+)?${Regex.escape(text)}\s*=""")
            val matches = varPattern.findAll(fileText).toList()

            if (matches.size > 1) {
                // Check if this element is part of a declaration (not the first one)
                val offset = element.textRange.startOffset
                val firstMatch = matches.first()
                if (offset > firstMatch.range.first) {
                    holder.newAnnotation(
                        HighlightSeverity.ERROR,
                        "Variable '$text' is already declared"
                    )
                        .range(element)
                        .create()
                }
            }

            // Check for assignment to locked variables
            val lockPattern = Regex("""lock\s+(?:num\s+|literal\s+)?${Regex.escape(text)}\s*=""")
            if (lockPattern.containsMatchIn(fileText)) {
                // Check if this is an assignment
                val offset = element.textRange.startOffset
                if (offset > 0 && fileText.getOrNull(offset - 1) == ':' ||
                    (offset > 1 && fileText.substring(maxOf(0, offset - 3), offset).trim() == ":=")) {
                    holder.newAnnotation(
                        HighlightSeverity.ERROR,
                        "Cannot reassign locked variable '$text'"
                    )
                        .range(element)
                        .create()
                }
            }
        }
    }


    private fun getDeclaredPlugins(fileText: String): Set<String> {
        val plugins = mutableSetOf<String>()
        val declarePattern = Regex("""declare\s+(\w+)(?:@\d+)?""")

        declarePattern.findAll(fileText).forEach { match ->
            plugins.add(match.groupValues[1])
        }

        return plugins
    }

    private fun checkPluginSpecificKeyword(
        text: String,
        declaredPlugins: Set<String>,
        element: PsiElement,
        holder: AnnotationHolder
    ) {
        for ((pluginName, keywords) in PLUGIN_KEYWORDS) {
            if (text in keywords && pluginName !in declaredPlugins) {
                holder.newAnnotation(
                    HighlightSeverity.ERROR,
                    "Keyword '$text' requires 'declare $pluginName' at the top of the file"
                )
                    .range(element)
                    .create()
                return
            }
        }
    }

    private fun isFollowedByArguments(element: PsiElement): Boolean {
        val next = element.nextSibling ?: return false
        val nextText = next.text.trim()
        return nextText.isNotEmpty() && (nextText[0].isLetterOrDigit() || nextText[0] in "\"'{[")
    }

    private fun isFunctionName(text: String): Boolean {
        return text.matches(Regex("[a-z_][a-zA-Z0-9_]*"))
    }
}

