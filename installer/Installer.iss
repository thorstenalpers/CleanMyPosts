#define MyAppName "CleanMyPosts"
#define MyAppPublisher "Thorsten Alpers"
#define MyAppURL "https://github.com/thorstenalpers/CleanMyPosts"
#define MyAppExeName "CleanMyPosts.exe"
#define MyIconPath "..\src\UI\Assets\logo.ico"

; dynamically set in github actions, ifndef use local values
#ifndef MyAppVersion	
  #define MyAppVersion "0.0.1"
#endif
#ifndef MyAppExePath
  #define MyAppExePath "..\src\UI\bin\Release\net9.0-windows10.0.19041.0\win-x64\publish\*"
#endif

[Setup]
AppId={{AEE32610-58A5-4785-98B0-B651865B30D2}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
UninstallDisplayIcon={app}\{#MyAppExeName}
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes
PrivilegesRequired=admin
OutputBaseFilename=CleanMyPosts-Installer-{#MyAppVersion}-win-x64
SolidCompression=yes
WizardStyle=modern
SetupIconFile={#MyIconPath}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "{#MyAppExePath}"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#MyIconPath}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\logo.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\logo.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

