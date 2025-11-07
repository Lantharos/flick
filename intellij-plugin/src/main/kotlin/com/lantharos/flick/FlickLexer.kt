package com.lantharos.flick

import com.intellij.lexer.Lexer
import com.intellij.lexer.LexerBase
import com.intellij.psi.tree.IElementType

class FlickLexer : LexerBase() {
    private var buffer: CharSequence = ""
    private var startOffset = 0
    private var endOffset = 0
    private var currentOffset = 0
    private var tokenType: IElementType? = null
    private var state = 0

    override fun start(buffer: CharSequence, startOffset: Int, endOffset: Int, initialState: Int) {
        this.buffer = buffer
        this.startOffset = startOffset
        this.endOffset = endOffset
        this.currentOffset = startOffset
        this.state = initialState
        advance()
    }

    override fun getState() = state

    override fun getTokenType() = tokenType

    override fun getTokenStart() = startOffset

    override fun getTokenEnd() = currentOffset

    override fun advance() {
        startOffset = currentOffset
        if (currentOffset >= endOffset) {
            tokenType = null
            return
        }

        tokenType = when {
            isWhitespace(peek()) -> scanWhitespace()
            peek() == '#' -> scanComment()
            peek() == '"' -> scanString()
            peek() == '\'' -> scanString()
            isDigit(peek()) -> scanNumber()
            isLetter(peek()) || peek() == '_' -> scanIdentifierOrKeyword()
            peek() == '/' && peekNext() == '/' -> scanComment()
            peek() == ':' && peekNext() == '=' -> scanOperator(2)
            peek() == '=' && peekNext() == '=' -> scanOperator(2)
            peek() == '!' && peekNext() == '=' -> scanOperator(2)
            peek() == '<' && peekNext() == '=' -> scanOperator(2)
            peek() == '>' && peekNext() == '=' -> scanOperator(2)
            peek() == '=' && peekNext() == '>' -> scanOperator(2)
            peek() in "(){}[]" -> scanBracket()
            peek() in "+-*/<>=!.,;:@" -> scanOperator(1)
            else -> {
                currentOffset++
                FlickTokenTypes.BAD_CHARACTER
            }
        }
    }

    private fun peek(offset: Int = 0): Char {
        val pos = currentOffset + offset
        return if (pos < endOffset) buffer[pos] else '\u0000'
    }

    private fun peekNext() = peek(1)

    private fun scanWhitespace(): IElementType {
        while (currentOffset < endOffset && isWhitespace(peek())) {
            currentOffset++
        }
        return FlickTokenTypes.WHITE_SPACE
    }

    private fun scanComment(): IElementType {
        while (currentOffset < endOffset && peek() != '\n') {
            currentOffset++
        }
        return FlickTokenTypes.COMMENT
    }

    private fun scanString(): IElementType {
        val quote = peek()
        currentOffset++ // skip opening quote
        while (currentOffset < endOffset && peek() != quote) {
            if (peek() == '\\') currentOffset++ // skip escape
            currentOffset++
        }
        if (currentOffset < endOffset) currentOffset++ // skip closing quote
        return FlickTokenTypes.STRING
    }

    private fun scanNumber(): IElementType {
        while (currentOffset < endOffset && (isDigit(peek()) || peek() == '.')) {
            currentOffset++
        }
        return FlickTokenTypes.NUMBER
    }

    private fun scanIdentifierOrKeyword(): IElementType {
        val start = currentOffset
        while (currentOffset < endOffset && (isLetterOrDigit(peek()) || peek() == '_')) {
            currentOffset++
        }
        val text = buffer.substring(start, currentOffset)
        return when (text) {
            // Keywords
            "free", "lock", "group", "task", "blueprint", "do", "for",
            "assume", "maybe", "otherwise", "each", "in", "march", "from", "to",
            "select", "when", "suppose", "print", "declare", "use", "import",
            "route", "respond", "with", "end", "yes", "no",
            "num", "literal" -> FlickTokenTypes.KEYWORD
            else -> FlickTokenTypes.IDENTIFIER
        }
    }

    private fun scanBracket(): IElementType {
        currentOffset++
        return when (buffer[startOffset]) {
            '(' -> FlickTokenTypes.LPAREN
            ')' -> FlickTokenTypes.RPAREN
            '{' -> FlickTokenTypes.LBRACE
            '}' -> FlickTokenTypes.RBRACE
            '[' -> FlickTokenTypes.LBRACKET
            ']' -> FlickTokenTypes.RBRACKET
            else -> FlickTokenTypes.BAD_CHARACTER
        }
    }

    private fun scanOperator(length: Int): IElementType {
        currentOffset += length
        return FlickTokenTypes.OPERATOR
    }

    private fun isWhitespace(c: Char) = c == ' ' || c == '\t' || c == '\n' || c == '\r'
    private fun isDigit(c: Char) = c in '0'..'9'
    private fun isLetter(c: Char) = c in 'a'..'z' || c in 'A'..'Z'
    private fun isLetterOrDigit(c: Char) = isLetter(c) || isDigit(c)

    override fun getBufferSequence() = buffer
    override fun getBufferEnd() = endOffset
}

