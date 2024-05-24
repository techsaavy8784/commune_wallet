// Copyright 2021 @communewallet/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useMemo } from 'react';
import InputWithLabel from '~components/InputWithLabel';
import ValidatedInput from '~components/ValidatedInput';
import { isNotShorterThan } from '~utils/validators';

interface Props {
  address?: string;
  className?: string;
  isFocused?: boolean;
  label?: string;
  onBlur?: () => void;
  onChange: (name: string | null) => void;
  value?: string | null;
}

function Name({
  address,
  className,
  isFocused,
  label,
  onBlur,
  onChange,
  value,
}: Props): React.ReactElement<Props> {
  const accounts = [{ address: '5xxx', name: 'something' }];
  const isNameValid = useMemo(
    () => isNotShorterThan(3, 'Account name is too short'),
    []
  );

  const account = accounts.find((account) => account.address === address);
  const startValue = value || account?.name;

  return (
    <ValidatedInput
      className={className}
      component={InputWithLabel}
      data-input-name
      defaultValue={startValue}
      isFocused={isFocused}
      label={label || 'A descriptive name for your account'}
      onBlur={onBlur}
      onEnter={onBlur}
      onValidatedChange={onChange}
      placeholder="REQUIRED"
      type="text"
      validator={isNameValid}
    />
  );
}

export default Name;
