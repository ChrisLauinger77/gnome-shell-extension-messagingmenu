#=============================================================================
UUID=messagingmenu@lauinger-clan.de
# GitHub doesn't accept @ in filesnames:
GHID=messagingmenu.lauinger-clan.de
NAME=messagingmenu
FILES=metadata.json *.js stylesheet.css schemas icons locale/**/ LICENSE.txt
INSTALLDIR=$(HOME)/.local/share/gnome-shell/extensions
#=============================================================================
default_target: all
.PHONY: clean all zip prod

MSGLANGS=$(notdir $(wildcard po/*po))
MSGOBJS=$(addprefix $(UUID)/locale/,$(MSGLANGS:.po=/LC_MESSAGES/$(NAME).mo))

prod: zip
	md5sum $(GHID).zip > $(GHID).zip.md5
	gpg --detach-sign --use-agent --yes $(GHID).zip

install: zip
	mkdir -p $(INSTALLDIR)/$(UUID)
	unzip $(GHID).zip -d $(INSTALLDIR)/$(UUID)

uninstall:
	rm -r $(INSTALLDIR)/$(UUID)

all: schemas pack

clean:
	rm -f $(GHID).zip* $(UUID)/schemas/gschemas.compiled $(UUID)/LICENSE.txt
	rm -rf $(UUID)/locale/**/

locales:
	sh update-translation-po-files.sh

schemas: $(UUID)/schemas/
	glib-compile-schemas $(UUID)/schemas

$(UUID)/LICENSE.txt: LICENSE.txt
	cp LICENSE.txt $(UUID)/LICENSE.txt

zip: all $(UUID)/LICENSE.txt
	cd $(UUID); zip -rq ../$(GHID).zip $(FILES:%=./%)

pack: $(UUID)
	cd $(UUID);gnome-extensions pack --podir=../po/ --out-dir=../ --extra-source=prefs.ui --extra-source=\icons;cd ..;mv messagingmenu@lauinger-clan.de.shell-extension.zip messagingmenu\@lauinger-clan.de.zip
