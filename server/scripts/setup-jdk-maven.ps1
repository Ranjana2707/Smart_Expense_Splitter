<#
setup-jdk-maven.ps1
Automates installation of Chocolatey (if missing), installs a JDK 21 build and Maven
on Windows, sets JAVA_HOME and updates PATH, verifies installs, and optionally runs
`mvn -B -DskipTests package` in the `server` folder.

Usage (run PowerShell as Administrator):
    Set-ExecutionPolicy Bypass -Scope Process -Force
    .\setup-jdk-maven.ps1 -InstallMaven -InstallJdk -RunBuild

Parameters:
    -InstallChocolatey (switch)  : Install Chocolatey if not present
    -InstallJdk (switch)         : Install a JDK (tries temurin packages via choco)
    -InstallMaven (switch)       : Install Apache Maven via choco
    -RunBuild (switch)           : After installs, runs `mvn -B -DskipTests package` in repo
    -ProjectDir (string)         : Directory to run build (defaults to script parent/..\)
#>
param(
    [switch]$InstallChocolatey = $true,
    [switch]$InstallJdk = $true,
    [switch]$InstallMaven = $true,
    [switch]$RunBuild = $false,
    [string]$ProjectDir = ".."
)

function Is-Admin {
    $current = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($current)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-Chocolatey {
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Host "Chocolatey already installed."
        return
    }
    Write-Host "Installing Chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    $chocoScript = 'https://chocolatey.org/install.ps1'
    try {
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString($chocoScript))
    } catch {
        Write-Error "Failed to download/install Chocolatey: $_"
        exit 3
    }
}

function Choco-InstallPackage {
    param($name)
    Write-Host "Attempting choco install $name -y"
    $proc = Start-Process -FilePath choco -ArgumentList @('install', $name, '-y', '--no-progress') -Wait -PassThru -ErrorAction SilentlyContinue
    return $proc.ExitCode -eq 0
}

function Download-And-Extract-Zip {
    param(
        [string]$Url,
        [string]$Destination
    )
    Write-Host "Downloading $Url"
    $tmp = Join-Path $env:TEMP ([IO.Path]::GetRandomFileName() + '.zip')
    try {
        Invoke-WebRequest -Uri $Url -OutFile $tmp -UseBasicParsing -ErrorAction Stop
        if (-not (Test-Path $Destination)) { New-Item -ItemType Directory -Path $Destination -Force | Out-Null }
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($tmp, $Destination)
        Remove-Item $tmp -Force
        return $true
    } catch {
        Write-Warning "Download or extraction failed: $_"
        if (Test-Path $tmp) { Remove-Item $tmp -Force }
        return $false
    }
}

function Install-JDK21 {
    # If choco available and running as admin, try choco packages first
    if (Get-Command choco -ErrorAction SilentlyContinue -OutVariable _choco) {
        if (Is-Admin) {
            $candidates = @('temurin', 'temurinjdk', 'temurinjdk21', 'openjdk', 'microsoft-openjdk')
            foreach ($pkg in $candidates) {
                Write-Host "Trying package: $pkg"
                if (Choco-InstallPackage $pkg) {
                    Write-Host "Installed $pkg via choco"
                    return $true
                }
            }
        } else {
            Write-Host "choco found but not running as Administrator; skipping choco installs."
        }
    }

    # Non-admin fallback: download Temurin JDK 21 zip and extract to user-local Programs
    $jdkDest = Join-Path $env:LOCALAPPDATA 'Programs\Java\jdk-21'
    if (Test-Path $jdkDest) { Write-Host "JDK target already exists: $jdkDest"; return $true }

    $temurinUrl = 'https://github.com/adoptium/temurin21-binaries/releases/latest/download/OpenJDK21U-jdk_x64_windows_hotspot.zip'
    Write-Host "Attempting non-admin JDK install to $jdkDest"
    if (Download-And-Extract-Zip -Url $temurinUrl -Destination $jdkDest) {
        Write-Host "JDK 21 extracted to $jdkDest"
        # Ensure JAVA_HOME user env
        [Environment]::SetEnvironmentVariable('JAVA_HOME',$jdkDest,'User')
        # Prepend bin to user Path
        $userPath = [Environment]::GetEnvironmentVariable('Path','User')
        $jdkBin = Join-Path $jdkDest 'bin'
        if (-not ($userPath -like "*$jdkBin*")) {
            $newUserPath = "$jdkBin;$userPath"
            [Environment]::SetEnvironmentVariable('Path',$newUserPath,'User')
        }
        return $true
    }
    Write-Warning "Non-admin JDK install failed. Please install JDK 21 manually and re-run."
    return $false
}

function Install-Maven {
    if (Get-Command mvn -ErrorAction SilentlyContinue) {
        Write-Host "Maven already installed."
        return $true
    }
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        if (Is-Admin) {
            if (Choco-InstallPackage 'maven') {
                Write-Host "Maven installed via Chocolatey."
                return $true
            }
        } else {
            Write-Host "choco present but not admin; skipping choco Maven install."
        }
    }

    # Non-admin fallback: download Maven binary and extract to user-local Programs
    $mvnVersion = '3.9.5'
    $mvnDest = Join-Path $env:LOCALAPPDATA "Programs\Maven\apache-maven-$mvnVersion"
    if (Test-Path $mvnDest) { Write-Host "Maven target already exists: $mvnDest"; return $true }
    $mvnZip = "https://archive.apache.org/dist/maven/maven-3/$mvnVersion/binaries/apache-maven-$mvnVersion-bin.zip"
    Write-Host "Attempting non-admin Maven install to $mvnDest"
    $tmpParent = Join-Path $env:TEMP ([IO.Path]::GetRandomFileName())
    New-Item -ItemType Directory -Path $tmpParent | Out-Null
    $ok = Download-And-Extract-Zip -Url $mvnZip -Destination $tmpParent
    if ($ok) {
        # The zip extracts to apache-maven-<version> folder inside tmpParent
        $extracted = Get-ChildItem -Path $tmpParent | Where-Object { $_.PsIsContainer } | Select-Object -First 1
        if ($null -eq $extracted) { Write-Warning "Unexpected zip layout"; Remove-Item $tmpParent -Recurse -Force; return $false }
        # Ensure destination parent exists
        $parentDir = Split-Path -Path $mvnDest -Parent
        if (-not (Test-Path $parentDir)) { New-Item -ItemType Directory -Path $parentDir -Force | Out-Null }
        try {
            Move-Item -Path $extracted.FullName -Destination $mvnDest -Force -ErrorAction Stop
        } catch {
            Write-Warning "Move-Item failed, attempting Copy-Item fallback: $_"
            Copy-Item -Path $extracted.FullName -Destination $mvnDest -Recurse -Force
            Remove-Item $extracted.FullName -Recurse -Force
        }
        Remove-Item $tmpParent -Recurse -Force
        # Add mvn bin to user Path
        $mvnBin = Join-Path $mvnDest 'bin'
        $userPath = [Environment]::GetEnvironmentVariable('Path','User')
        if (-not ($userPath -like "*$mvnBin*")) {
            $newUserPath = "$mvnBin;$userPath"
            [Environment]::SetEnvironmentVariable('Path',$newUserPath,'User')
        }
        Write-Host "Maven installed to $mvnDest"
        # Refresh environment so mvn is immediately available in this process
        Refresh-Environment
        return $true
    }
    Write-Warning "Non-admin Maven install failed. Please install Maven manually and re-run."
    return $false
}

function Refresh-Environment {
    Write-Host "Refreshing environment variables for the current process..."
    $env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
    $env:JAVA_HOME = [System.Environment]::GetEnvironmentVariable('JAVA_HOME','Machine')
}

function Set-JavaHomeFromJava {
    try {
        $out = & java -XshowSettings:properties -version 2>&1 | Select-String 'java.home'
        if ($out) {
            $javaHome = ($out -split ':')[1].Trim()
            if ($javaHome) {
                Write-Host "Detected java.home: $javaHome"
                [Environment]::SetEnvironmentVariable('JAVA_HOME',$javaHome,'Machine')
                return $true
            }
        }
    } catch {
        Write-Warning "Unable to detect java.home from java command."
    }
    return $false
}

# MAIN

if (-not (Is-Admin)) {
    Write-Warning "Not running as Administrator. The script will attempt non-admin, user-local installs where possible."
} else {
    Write-Host "Running as Administrator. Admin installs (Chocolatey) are allowed."
}

if ($InstallChocolatey -and (Is-Admin)) { Install-Chocolatey }

if ($InstallJdk) {
    if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
        $ok = Install-JDK21
        if (-not $ok) { Write-Warning "JDK installation did not succeed. You may need to install JDK 21 manually." }
    } else {
        Write-Host "Java already available on PATH."
    }
}

Refresh-Environment

if (-not [Environment]::GetEnvironmentVariable('JAVA_HOME','User')) {
    if (-not (Set-JavaHomeFromJava)) {
        Write-Warning "JAVA_HOME (User) not set. If JDK was installed non-admin, ensure your user env vars include JAVA_HOME pointing to your JDK 21 folder and reopen the shell."
    } else { Refresh-Environment }
} else { Write-Host "JAVA_HOME already set (User): $([Environment]::GetEnvironmentVariable('JAVA_HOME','User'))" }

if ($InstallMaven) { Install-Maven }

# Final verification
Write-Host "\n---- Verification ----"
Refresh-Environment
try { & java -version } catch { Write-Warning "java not found in PATH" }
try { & mvn -version } catch { Write-Warning "mvn not found in PATH" }

if ($RunBuild) {
    $absoluteProjectDir = Resolve-Path -Path $ProjectDir
    Write-Host "Running Maven build in $absoluteProjectDir"
    Push-Location $absoluteProjectDir
        try {
            # Try to run mvn; retry once after refreshing env
            & mvn -B -DskipTests package
            $exit = $LASTEXITCODE
            if ($exit -ne 0) {
                Write-Warning "Initial mvn invocation failed (exit $exit). Refreshing environment and retrying."
                Refresh-Environment
                & mvn -B -DskipTests package
                $exit = $LASTEXITCODE
                if ($exit -ne 0) { Write-Error "Maven build failed (exit code $exit)"; exit $exit }
            }
            Write-Host "Maven build completed successfully."
        } finally { Pop-Location }
}

Write-Host "Script finished. If any step failed, follow the warnings above or re-run with Administrator privileges." 