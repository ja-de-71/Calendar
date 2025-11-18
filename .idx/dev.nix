{ pkgs, ... }: {

  # Nixpkgs channel.
  channel = "stable-24.05";

  # Packages to make available in the environment.
  packages = [
    pkgs.nodejs_20
    pkgs.firebase-tools
    pkgs.nodePackages.npm
  ];

  # VS Code extensions to install.
  idx.extensions = [
    "dbaeumer.vscode-eslint"
    "esbenp.prettier-vscode"
    "ms-vscode.vscode-typescript-next"
  ];

}
