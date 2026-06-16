import React from 'react';
import PrivacyConsent from './PrivacyConsent.jsx';

export default {
  title: 'Components/PrivacyConsent',
  component: PrivacyConsent,
  parameters: {
    a11y: {
      element: '#root'
    }
  }
};

export const Default = () => (
  <div style={{ padding: 20, maxWidth: 560 }}>
    <PrivacyConsent onAccept={(s)=>console.log('accepted', s)} onManage={(s)=>console.log('manage', s)} />
  </div>
);
