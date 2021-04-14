import React, { ChangeEventHandler, CSSProperties, useEffect, useRef, useState } from 'react';
import { validate, RuleItem } from '../../shared/validation-rules';
import { componentClassNames, overrideChildren } from '../../shared/class-util';
import { ButtonProps } from '../button/button';
import { ErrorList } from 'async-validator';
import { FormErrorText } from '../error-text/error-text';

export interface FormLabelStyle {
  // 组件属性 //

  /* 标签位置 */
  position?: 'top' | 'left';

  /* 类名 */
  className?: string;
  /* 样式 */
  style?: CSSProperties;

  /* 标签位置 */
  textAlign?: 'left' | 'right';

  /* 标签宽度 */
  width?: string;
}

export interface FormItemLabelProps extends FormLabelStyle {
  /* Label显示文字 */
  text: string;
}

export interface FormProps {
  // 组件属性 //

  /* 子组件 */
  children?: React.ReactNode;

  /* 类名 */
  className?: string;
  /* 样式 */
  style?: CSSProperties;

  /* 表单数据 */
  data?: any;

  /* 宽度 */
  width?: string;

  /* 表单内所有Label样式 */
  labelLayout?: FormLabelStyle;

  /* 数据改变回调 */
  onDataChange?: (data: any) => void;

  /* 数据提交事件 */
  onSubmit?: (data: any, error: any) => void;
}

const Form = ({
  className,
  style,
  children,
  data = {},
  onDataChange,
  onSubmit,
  labelLayout,
  width
}: FormProps) => {
  const [formData, setFormData] = useState(data);
  const [formErrors, setFormErrors] = useState([] as ErrorList);
  const formDataValidators = useRef({} as any);

  useEffect(() => {
    setFormData(data);
  }, [data]);

  let newChildren = overrideChildren(children, (elementName, props) => {
    if (
      elementName === 'Input' ||
      elementName === 'TextArea' ||
      elementName === 'CheckBox' ||
      elementName === 'RadioGroup' ||
      elementName === 'CheckBoxGroup'
    ) {
      let inputProps = props as {
        name?: string;
        onChange?: ChangeEventHandler<HTMLInputElement>;
        onValueChange?: (val: string) => void;
        label?: FormItemLabelProps | string;
        value?: any;
        rules?: RuleItem[] | RuleItem;
        error?: FormErrorText;
      };

      if (inputProps.name) {
        const inputOnChange = inputProps.onChange;
        const inputOnValueChange = inputProps.onValueChange;

        inputProps.error = undefined;
        if (formErrors) {
          formErrors.forEach(error => {
            if (error.field === inputProps.name) {
              inputProps.error = { show: true, message: error.message };
            }
          });
        }

        if (inputProps.rules) {
          const updateRule = (rule: RuleItem) => {
            if (rule.type === 'number' || rule.type === 'integer' || rule.type === 'float') {
              rule.transform = value => {
                if (!rule.required && !value) {
                  return '';
                }
                return Number(value);
              };
            }
          };
          if (Array.isArray(inputProps.rules)) {
            inputProps.rules.forEach(rule => {
              updateRule(rule);
            });
          } else {
            updateRule(inputProps.rules);
          }
          formDataValidators.current[inputProps.name] = inputProps.rules;
        }

        inputProps = {
          ...inputProps,
          value: formData[inputProps.name] || (elementName === 'CheckBoxGroup' ? [] : '')
        };

        const clearError = () => {
          if (formErrors) {
            for (let i = 0; i < formErrors.length; i++) {
              if (formErrors[i].field === inputProps.name) {
                formErrors.splice(i, 1);
                setFormErrors(formErrors);
                break;
              }
            }
          }
        };

        if (['Input', 'TextArea', 'CheckBox'].includes(elementName)) {
          inputProps.onChange = evt => {
            const newFormData = { ...formData, [inputProps.name!]: evt.target.value };
            setFormData(newFormData);
            inputOnChange && inputOnChange(evt);
            onDataChange && onDataChange(newFormData);
            clearError();
          };
        } else if (['RadioGroup', 'CheckBoxGroup'].includes(elementName)) {
          inputProps.onValueChange = value => {
            const newFormData = { ...formData, [inputProps.name!]: value };
            setFormData(newFormData);
            inputOnValueChange && inputOnValueChange(value);
            onDataChange && onDataChange(newFormData);
            clearError();
          };
        }
      }

      const combinedLabelStyle: FormItemLabelProps =
        typeof inputProps.label === 'object'
          ? { ...labelLayout, ...inputProps.label }
          : { ...labelLayout, text: inputProps.label || '' };
      inputProps = {
        ...inputProps,
        label: combinedLabelStyle
      };

      return inputProps;
    } else if (elementName === 'ButtonGroup') {
      let inputProps = props;
      const combinedLabelStyle: FormItemLabelProps =
        typeof inputProps.label === 'object'
          ? { ...labelLayout, ...inputProps.label }
          : { ...labelLayout, text: inputProps.label || '' };
      inputProps = {
        ...inputProps,
        label: combinedLabelStyle
      };
      return inputProps;
    } else if (elementName === 'Button') {
      let buttonProps = props as ButtonProps;
      if (buttonProps.formSubmit) {
        const buttonOnClick = buttonProps.onClick;
        buttonProps.onClick = evt => {
          buttonOnClick && buttonOnClick(evt);
          validate(formDataValidators.current, formData, errorList => {
            setFormErrors(errorList);
            onSubmit && onSubmit(formData, errorList);
          });
        };
      }
      return buttonProps;
    }
    return props;
  });

  return (
    <div className={componentClassNames('pui-form', {}, className)} style={{ width, ...style }}>
      {newChildren}
    </div>
  );
};

export { Form };
