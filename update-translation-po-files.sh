#!/bin/bash

reffile=messagingmenu.pot

xgettext --from-code=UTF-8 --output=po/"$reffile" messagingmenu\@lauinger-clan.de/*.js messagingmenu\@lauinger-clan.de/ui/*.ui messagingmenu\@lauinger-clan.de/schemas/*.xml

cd po

for pofile in *.po
	do
		echo "Updating: $pofile"
		msgmerge -U "$pofile" "$reffile"
	done

rm *.po~
echo "Done."
