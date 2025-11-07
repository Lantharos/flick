package com.lantharos.flick

import com.intellij.lang.annotation.AnnotationHolder
import com.intellij.lang.annotation.Annotator
import com.intellij.lang.annotation.HighlightSeverity
import com.intellij.openapi.editor.DefaultLanguageHighlighterColors
import com.intellij.psi.PsiElement

class FlickAnnotator : Annotator {

    override fun annotate(element: PsiElement, holder: AnnotationHolder) {
        if (element.containingFile.fileType != FlickFileType) return

        val text = element.text
        val fileText = element.containingFile.text

        // Get declared plugins from the file
        val declaredPlugins = getDeclaredPlugins(fileText)

        // Check for common errors
        when {
            // Unclosed strings
            text.startsWith("\"") && !text.endsWith("\"") && text.length > 1 -> {
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

// Built-in functions that should be highlighted
val BUILTIN_FUNCTIONS = setOf(
    "print", "ask", "num", "str", "read", "write", "exists",
    "sleep", "now", "random", "randint", "shuffle", "choice"
)

// Plugin-specific keywords and functions
val WEB_PLUGIN_KEYWORDS = setOf("route", "respond", "GET", "POST", "PUT", "DELETE", "PATCH")
val DB_PLUGIN_KEYWORDS = setOf("query", "execute", "transaction", "connect")
val FILE_PLUGIN_KEYWORDS = setOf("read", "write", "exists", "listdir")

// Map plugins to their keywords
val PLUGIN_KEYWORDS = mapOf(
    "web" to WEB_PLUGIN_KEYWORDS,
    "db" to DB_PLUGIN_KEYWORDS,
    "file" to FILE_PLUGIN_KEYWORDS
)