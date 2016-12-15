﻿import {
    TextBaseCommon, textProperty, formattedTextProperty, textAlignmentProperty, textDecorationProperty,
    textTransformProperty, letterSpacingProperty, colorProperty, fontInternalProperty, whiteSpaceProperty,
    Font, Color, FormattedString, TextDecoration
} from "./text-base-common";

export * from "./text-base-common";

function getCapitalizedString(str: string): string {
    let words = str.split(" ");
    let newWords = [];
    for (let i = 0, length = words.length; i < length; i++) {
        let word = words[i].toLowerCase();
        newWords.push(word.substr(0, 1).toUpperCase() + word.substring(1));
    }

    return newWords.join(" ");
}

export function getTransformedText(text: string, transform: "none" | "capitalize" | "uppercase" | "lowercase"): string {
    switch (transform) {
        case "uppercase":
            return text.toUpperCase();

        case "lowercase":
            return text.toLowerCase();

        case "capitalize":
            return getCapitalizedString(text);

        default:
            return text;
    }
}

@Interfaces([android.text.method.TransformationMethod])
class TextTransformation extends android.text.method.ReplacementTransformationMethod {
    constructor(public originalText: string, public formattedText: FormattedString, public textTransform: "none" | "capitalize" | "uppercase" | "lowercase") {
        super();
        return global.__native(this);
    }

    protected getOriginal(): native.Array<string> {
        return this.formattedText ? this.formattedText._formattedText : this.originalText;
    }

    protected getReplacement(): native.Array<string> {
        let result: string = "";
        let textTransform = this.textTransform
        if (this.formattedText) {
            for (let i = 0, length = this.formattedText.spans.length; i < length; i++) {
                let span = this.formattedText.spans.getItem(i);
                result += getTransformedText(span.text, textTransform);
                // span.text = formatString(span.text, this.textTransform);
            }
        } else {
            result = getTransformedText(this.originalText, textTransform);
        }

        return result;
    }
}

export class TextBase extends TextBaseCommon {
    _transformationMethod: any;
    _nativeView: android.widget.TextView;

    public _setFormattedTextPropertyToNative(value: FormattedString) {
        // TODO: Check if there is an option to force call the transformation method without
        // creating new native instance.
        if (this._nativeView) {
            this._nativeView.setTransformationMethod(new TextTransformation(this.text, value, this.style.textTransform));
        }

        let newText = value ? value._formattedText : null;
        if (this._nativeView) {
            this._nativeView.setText(newText);
        }
    }

    get [textProperty.native](): string {
        return this._nativeView.getText();
    }
    set [textProperty.native](value: string) {
        if (value === null || value === undefined) {
            value = "";
        }

        this._nativeView.setText(value);
    }

    get [formattedTextProperty.native](): FormattedString {
        return null;
    }
    set [formattedTextProperty.native](value: FormattedString) {
        this._setFormattedTextPropertyToNative(value);
    }

    get [colorProperty.native](): android.content.res.ColorStateList {
        return this._nativeView.getTextColors();
    }
    set [colorProperty.native](value: Color | android.content.res.ColorStateList) {
        if (value instanceof Color) {
            this._nativeView.setTextColor(value.android);
        } else {
            this._nativeView.setTextColor(value);
        }
    }

    get [fontInternalProperty.native](): { typeface: android.graphics.Typeface, fontSize: number } {
        let textView = this._nativeView;
        return {
            typeface: textView.getTypeface(),
            fontSize: textView.getTextSize()
        };
    }
    set [fontInternalProperty.native](value: Font | { typeface: android.graphics.Typeface, fontSize: number }) {
        let textView = this._nativeView;

        let typeface: android.graphics.Typeface;
        let fontSize: number;
        if (value instanceof Font) {
            typeface = value.getAndroidTypeface();
            textView.setTextSize(value.fontSize);
        } else {
            typeface = value.typeface;
            textView.setTextSize(android.util.TypedValue.COMPLEX_UNIT_PX, value.fontSize);
        }

        textView.setTypeface(typeface);
    }

    get [textAlignmentProperty.native](): string {
        let textGravity = this._nativeView.getGravity() & android.view.View.TEXT_ALIGNMENT_GRAVITY;
        switch (textGravity) {
            case android.view.Gravity.LEFT:
                return "left";

            case android.view.Gravity.CENTER_HORIZONTAL:
                return "center";

            case android.view.Gravity.RIGHT:
                return "right";

            default:
                throw new Error("Invalid textGravity: " + textGravity);
        }
    }
    set [textAlignmentProperty.native](value: string) {
        let verticalGravity = this._nativeView.getGravity() & android.view.Gravity.VERTICAL_GRAVITY_MASK;
        switch (value) {
            case "left":
                this._nativeView.setGravity(android.view.Gravity.LEFT | verticalGravity);
                break;
            case "center":
                this._nativeView.setGravity(android.view.Gravity.CENTER_HORIZONTAL | verticalGravity);
                break;
            case "right":
                this._nativeView.setGravity(android.view.Gravity.RIGHT | verticalGravity);
                break;
            default:
                break;
        }
    }

    get [textDecorationProperty.native](): TextDecoration {
        return "none";
    }
    set [textDecorationProperty.native](value: TextDecoration) {
        let flags = 0;
        let values = (value + "").split(" ");

        if (values.indexOf("underline") !== -1) {
            flags = flags | android.graphics.Paint.UNDERLINE_TEXT_FLAG;
        }

        if (values.indexOf("line-through") !== -1) {
            flags = flags | android.graphics.Paint.STRIKE_THRU_TEXT_FLAG;
        }

        if (values.indexOf("none") === -1) {
            this._nativeView.setPaintFlags(flags);
        } else {
            this._nativeView.setPaintFlags(0);
        }
    }

    get [textTransformProperty.native](): "none" | "capitalize" | "uppercase" | "lowercase" {
        return "none";
    }
    set [textTransformProperty.native](value: "none" | "capitalize" | "uppercase" | "lowercase") {
        this._setFormattedTextPropertyToNative(this.formattedText);
    }

    get [whiteSpaceProperty.native](): "normal" | "nowrap" {
        return "normal";
    }
    set [whiteSpaceProperty.native](value: "normal" | "nowrap") {
        let nativeView = this._nativeView;
        let nowrap = value === "nowrap";
        nativeView.setSingleLine(nowrap);
        nativeView.setEllipsize(nowrap ? android.text.TextUtils.TruncateAt.END : null);
    }

    get [letterSpacingProperty.native](): number {
        return org.nativescript.widgets.ViewHelper.getLetterspacing(this._nativeView);
    }
    set [letterSpacingProperty.native](value: number) {
        org.nativescript.widgets.ViewHelper.setLetterspacing(this._nativeView, value);
    }
}