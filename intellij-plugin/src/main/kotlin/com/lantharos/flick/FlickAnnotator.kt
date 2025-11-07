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

            // Highlight function calls
            isFollowedByArguments(element) && isFunctionName(text) -> {
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

