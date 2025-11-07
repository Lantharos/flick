package com.lantharos.flick

import com.intellij.psi.tree.IElementType
import com.intellij.psi.TokenType

object FlickTokenTypes {
    val WHITE_SPACE = TokenType.WHITE_SPACE
    val BAD_CHARACTER = TokenType.BAD_CHARACTER

    val COMMENT = IElementType("COMMENT", FlickLanguage)
    val KEYWORD = IElementType("KEYWORD", FlickLanguage)
    val IDENTIFIER = IElementType("IDENTIFIER", FlickLanguage)
    val STRING = IElementType("STRING", FlickLanguage)
    val NUMBER = IElementType("NUMBER", FlickLanguage)
    val OPERATOR = IElementType("OPERATOR", FlickLanguage)

    val LPAREN = IElementType("LPAREN", FlickLanguage)
    val RPAREN = IElementType("RPAREN", FlickLanguage)
    val LBRACE = IElementType("LBRACE", FlickLanguage)
    val RBRACE = IElementType("RBRACE", FlickLanguage)
    val LBRACKET = IElementType("LBRACKET", FlickLanguage)
    val RBRACKET = IElementType("RBRACKET", FlickLanguage)
}

