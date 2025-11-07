package com.lantharos.flick

import com.intellij.openapi.editor.DefaultLanguageHighlighterColors
import com.intellij.openapi.editor.colors.TextAttributesKey
import com.intellij.openapi.fileTypes.SyntaxHighlighterBase
import com.intellij.psi.tree.IElementType
import com.intellij.openapi.editor.HighlighterColors

class FlickSyntaxHighlighter : SyntaxHighlighterBase() {

    companion object {
        val KEYWORD = TextAttributesKey.createTextAttributesKey(
            "FLICK_KEYWORD",
            DefaultLanguageHighlighterColors.KEYWORD
        )

        val COMMENT = TextAttributesKey.createTextAttributesKey(
            "FLICK_COMMENT",
            DefaultLanguageHighlighterColors.LINE_COMMENT
        )

        val STRING = TextAttributesKey.createTextAttributesKey(
            "FLICK_STRING",
            DefaultLanguageHighlighterColors.STRING
        )

        val NUMBER = TextAttributesKey.createTextAttributesKey(
            "FLICK_NUMBER",
            DefaultLanguageHighlighterColors.NUMBER
        )

        val OPERATOR = TextAttributesKey.createTextAttributesKey(
            "FLICK_OPERATOR",
            DefaultLanguageHighlighterColors.OPERATION_SIGN
        )

        val IDENTIFIER = TextAttributesKey.createTextAttributesKey(
            "FLICK_IDENTIFIER",
            DefaultLanguageHighlighterColors.IDENTIFIER
        )

        val BRACKETS = TextAttributesKey.createTextAttributesKey(
            "FLICK_BRACKETS",
            DefaultLanguageHighlighterColors.BRACKETS
        )

        val BAD_CHARACTER = TextAttributesKey.createTextAttributesKey(
            "FLICK_BAD_CHARACTER",
            HighlighterColors.BAD_CHARACTER
        )
    }

    override fun getHighlightingLexer() = FlickLexer()

    override fun getTokenHighlights(tokenType: IElementType?): Array<TextAttributesKey> {
        return when (tokenType) {
            FlickTokenTypes.KEYWORD -> arrayOf(KEYWORD)
            FlickTokenTypes.COMMENT -> arrayOf(COMMENT)
            FlickTokenTypes.STRING -> arrayOf(STRING)
            FlickTokenTypes.NUMBER -> arrayOf(NUMBER)
            FlickTokenTypes.OPERATOR -> arrayOf(OPERATOR)
            FlickTokenTypes.IDENTIFIER -> arrayOf(IDENTIFIER)
            FlickTokenTypes.LPAREN, FlickTokenTypes.RPAREN,
            FlickTokenTypes.LBRACE, FlickTokenTypes.RBRACE,
            FlickTokenTypes.LBRACKET, FlickTokenTypes.RBRACKET -> arrayOf(BRACKETS)
            FlickTokenTypes.BAD_CHARACTER -> arrayOf(BAD_CHARACTER)
            else -> emptyArray()
        }
    }
}

