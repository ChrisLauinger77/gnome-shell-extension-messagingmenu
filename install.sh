#!/bin/bash

# glib-compile-schemas messagingmenu\@lauinger-clan.de/schemas/

cd messagingmenu\@lauinger-clan.de
gnome-extensions pack --podir=../po/ --out-dir=../ --extra-source=\ui --extra-source=\icons --extra-source=../LICENSE
cd ..

if [ "$1" = "zip" ] || [ "$1" = "pack" ]; then
   echo "Extension zip created ..."
else
   gnome-extensions install messagingmenu\@lauinger-clan.de.shell-extension.zip --force
   gnome-extensions enable messagingmenu\@lauinger-clan.shell-extension.de
fi
