
# react-device-detector

Bare minimum device detector with no dependecy
Renders components based on device
# only 498B gziped

# Installing

```bash
npm install react-device-detector
```

```bash
yarn add react-device-detector
```

# Usage

```javascript
import {
    AndroidView ,
    IOSView ,
    MobileView ,
    DesktopView
} from 'react-device-detector';

const MyComponent = () => {
  return (
      <>
        <AndroidView>
            this will only render on android devices
        </AndroidView>

        <IOSView>
            this will only render on iOS devices
        </IOSView>

        <MobileView>
            this will only render on mobile
        </MobileView>

        <DesktopView>
            this will only render on desktop
        </DesktopView>
      </>
  );
};
```

# Contributing

If you have any new suggestions, new features, bug fixes, etc. please contribute by raising pull 