// declarations for react-native-vector-icons modules to silence TS7016 errors

declare module "react-native-vector-icons/FontAwesome" {
  import { Icon } from "react-native-vector-icons/Icon";
  const FontAwesome: typeof Icon;
  export default FontAwesome;
}
declare module "react-native-vector-icons/Feather" {
  import { Icon } from "react-native-vector-icons/Icon";
  const Feather: typeof Icon;
  export default Feather;
}
declare module "react-native-vector-icons/MaterialCommunityIcons" {
  import { Icon } from "react-native-vector-icons/Icon";
  const MaterialCommunityIcons: typeof Icon;
  export default MaterialCommunityIcons;
}
