import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  NgZone,
  ViewEncapsulation,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import diff from 'fast-diff';

import { MonacoCommonEditorComponent } from './monaco-common-editor.component';
import { MonacoEditorConfig } from './monaco-editor-config';
import { MonacoProviderService } from './monaco-provider.service';
import { ResizeSensorService } from './resize-sensor.service';

/**
 * Wraps powerful Monaco Editor for simpilicity use in Angular.
 */
@Component({
  selector: 'ng-monaco-editor',
  templateUrl: './monaco-editor.component.html',
  styleUrls: ['./monaco-editor.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  preserveWhitespaces: false,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MonacoEditorComponent),
      multi: true,
    },
  ],
})
export class MonacoEditorComponent extends MonacoCommonEditorComponent {
  constructor(
    zone: NgZone,
    monacoEditorConfig: MonacoEditorConfig,
    monacoProvider: MonacoProviderService,
    cdr: ChangeDetectorRef,
    resizeSensor: ResizeSensorService,
  ) {
    super(zone, monacoEditorConfig, monacoProvider, cdr, resizeSensor);
  }

  createEditor(): import('monaco-editor').editor.IStandaloneCodeEditor {
    this.model = this.createModel(this._value, this.modelUri);
    const editor = this.monacoProvider.create(this.monacoAnchor.nativeElement, {
      ...this.options,
      model: this.model,
    });

    if (this.originalValue) {
      let lastDecorations: string[] = [];
      editor.onDidChangeModelContent(() => {
        let lastPosition = { lineNumber: 1, column: 1 };
        const decorations:
          | Array<import('monaco-editor').editor.IModelDeltaDecoration>
          | any = diff(this.originalValue, this.model.getValue()).map(
          ([mode, text]) => {
            const range = this.getRangeFromText(text, lastPosition);
            lastPosition = {
              lineNumber: range.endLineNumber,
              column: range.endColumn,
            };

            return {
              range,
              options: {
                isWholeLine: true,
                linesDecorationsClassName:
                  'ng-monaco-editor-line-decorator-' + mode,
              },
            };
          },
        );

        lastDecorations = editor.deltaDecorations(lastDecorations, decorations);
      });
    }

    return editor;
  }

  // TODO: fixme for deleted lines:
  private getRangeFromText(
    text: string,
    pos: import('monaco-editor').IPosition,
  ): import('monaco-editor').IRange {
    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1];
    return {
      startLineNumber: pos.lineNumber,
      endLineNumber: pos.lineNumber + lines.length - 1,
      startColumn: pos.column,
      endColumn: lastLine.length,
    };
  }
}
