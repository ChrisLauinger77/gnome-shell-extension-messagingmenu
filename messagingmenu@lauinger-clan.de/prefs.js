import Gdk from "gi://Gdk";
import Gtk from "gi://Gtk";
import Gio from "gi://Gio";
import Adw from "gi://Adw";
import {
    ExtensionPreferences,
    gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class AdwPrefs extends ExtensionPreferences {
    _addMenuChangeDesc(cmb_add, group_add) {
        if (cmb_add.get_active() < 3) {
            group_add.set_description(
                _("Name of .desktop files without .desktop ending")
            );
        } else {
            group_add.set_description(_("Notifier title"));
        }
    }

    _addMenu(cmb_add, entry_add, builder) {
        if (entry_add.text == "") {
            return false;
        }
        let strsettings;
        let strgroup;
        switch (cmb_add.get_active_id()) {
            case "email":
                strsettings = "compatible-emails";
                strgroup = "messagingmenu_group_email";
                break;
            case "chat":
                strsettings = "compatible-chats";
                strgroup = "messagingmenu_group_chat";
                break;
            case "microblogging":
                strsettings = "compatible-mblogs";
                strgroup = "messagingmenu_group_mblog";
                break;
            case "emailnotifier":
                strsettings = "compatible-hidden-email-notifiers";
                strgroup = "messagingmenu_group_emailnotifiers";
                break;
            case "microbloggingnotifier":
                strsettings = "compatible-hidden-mblog-notifiers";
                strgroup = "messagingmenu_group_mblognotifiers";
                break;
            default:
                log("_addMenu did not find get_active_id");
        }
        let valuesettings = this.getSettings().get_string(strsettings);
        if (
            !valuesettings.toLowerCase().includes(entry_add.text.toLowerCase())
        ) {
            this.getSettings().set_string(
                strsettings,
                valuesettings + ";" + entry_add.text
            );
            let group = builder.get_object(strgroup);
            let adwrow = new Adw.ActionRow({ title: entry_add.text });
            group.add(adwrow);
            entry_add.text = "";
        }
    }

    _onBtnClicked(btn, filechooser) {
        let parent = btn.get_root();
        filechooser.set_transient_for(parent);

        let desktopFileFilter = new Gtk.FileFilter();
        filechooser.set_filter(desktopFileFilter);
        desktopFileFilter.add_pattern("*.desktop");

        filechooser.title = _("Select desktop file");

        filechooser.show();
    }

    _getFilename(fullPath) {
        log("_getFilename fullPath: " + fullPath);
        return fullPath.replace(/^.*[\\/]/, "");
    }

    _updateEntryAdd(entry_add) {
        entry_add.text = this.getSettings().get_string("last-choosen-file");
    }

    _onFileChooserResponse(native, response) {
        if (response !== Gtk.ResponseType.ACCEPT) {
            return;
        }
        let fileURI = native.get_file().get_uri().replace("file://", "");
        let entry_add = this._getFilename(fileURI).replace(".desktop", "");
        log("_onFileChooserResponse entry_add: " + entry_add);
        this.getSettings().set_string("last-choosen-file", entry_add);
    }

    _onColorChanged(color_setting_button) {
        this.getSettings().set_string(
            "color-rgba",
            color_setting_button.get_rgba().to_string()
        );
    }

    _rangeslider(key, values, tooltip, settings) {
        let [min, max, step, defv] = values;
        let range = Gtk.Scale.new_with_range(
            Gtk.Orientation.HORIZONTAL,
            min,
            max,
            step
        );
        range.set_tooltip_text(tooltip);
        range.set_value(settings.get_int(key));
        range.set_draw_value(true);
        range.add_mark(defv, Gtk.PositionType.BOTTOM, null);
        range.set_size_request(200, -1);

        range.connect("value-changed", function (slider) {
            settings.set_int(key, slider.get_value());
        });
        return range;
    }

    _page1(builder, settings) {
        let email_setting_switch = builder.get_object("email_setting_switch");
        email_setting_switch.set_tooltip_text(_("Toggle email notification"));
        settings.bind(
            "notify-email",
            email_setting_switch,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );
        let chat_setting_switch = builder.get_object("chat_setting_switch");
        chat_setting_switch.set_tooltip_text(_("Toggle chat notification"));
        settings.bind(
            "notify-chat",
            chat_setting_switch,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );
        let mblogging_setting_switch = builder.get_object(
            "mblogging_setting_switch"
        );
        mblogging_setting_switch.set_tooltip_text(
            _("Toggle micro blogging notification")
        );
        settings.bind(
            "notify-mblogging",
            mblogging_setting_switch,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );
        let color_setting_button = builder.get_object("color_setting_button");
        color_setting_button.set_tooltip_text(_("Notification Color RGB"));
        let mycolor = new Gdk.RGBA();
        mycolor.parse(this.getSettings().get_string("color-rgba"));
        color_setting_button.set_rgba(mycolor);
        color_setting_button.connect(
            "color-set",
            this._onColorChanged.bind(this, color_setting_button)
        );
        let row5 = builder.get_object("messagingmenu_row5");

        let iconsize_slider = this._rangeslider(
            "icon-size",
            [12, 48, 1, 22],
            _("Size of the app icons in the menu"),
            this.getSettings()
        );
        row5.add_suffix(iconsize_slider);
        row5.activatable_widget = iconsize_slider;

        let group_add = builder.get_object("messagingmenu_group_add");
        let cmb_add = builder.get_object("messagingmenu_cmb_add");
        cmb_add.set_active(0);
        cmb_add.connect(
            "changed",
            this._addMenuChangeDesc.bind(this, cmb_add, group_add)
        );
        let button_add = builder.get_object("button_add_menu_add");
        let entry_add = builder.get_object("entry_add_menu_name");
        button_add.connect(
            "clicked",
            this._addMenu.bind(this, cmb_add, entry_add, builder)
        );
        settings.connect(
            "changed::last-choosen-file",
            this._updateEntryAdd.bind(this, entry_add)
        );
        let adwrow = builder.get_object("messagingmenu_row_add2");
        adwrow.set_tooltip_text(
            _("Usually located in '/usr/share/applications'")
        );
        let buttonfilechooser = new Gtk.Button({
            label: _("..."),
            valign: Gtk.Align.CENTER,
        });
        adwrow.add_suffix(buttonfilechooser);
        adwrow.activatable_widget = buttonfilechooser;
        let filechooser = new Gtk.FileChooserNative({
            title: _("Select desktop file for ") + cmb_add.get_active_id,
            modal: true,
            action: Gtk.FileChooserAction.OPEN,
        });
        buttonfilechooser.connect(
            "clicked",
            this._onBtnClicked.bind(this, buttonfilechooser, filechooser)
        );
        filechooser.connect("response", this._onFileChooserResponse.bind(this));
    }

    _fillgroup(group, applist) {
        const { Adw } = imports.gi;
        for (let app of applist) {
            let adwrow = new Adw.ActionRow({ title: app });
            group.add(adwrow);
        }
    }

    _pages(builder, settings) {
        let apps = settings
            .get_string("compatible-emails")
            .split(";")
            .sort(Intl.Collator().compare);
        let group = builder.get_object("messagingmenu_group_email");
        this._fillgroup(group, apps);

        apps = settings
            .get_string("compatible-chats")
            .split(";")
            .sort(Intl.Collator().compare);
        group = builder.get_object("messagingmenu_group_chat");
        this._fillgroup(group, apps);

        apps = settings
            .get_string("compatible-mblogs")
            .split(";")
            .sort(Intl.Collator().compare);
        group = builder.get_object("messagingmenu_group_mblog");
        this._fillgroup(group, apps);

        apps = settings
            .get_string("compatible-hidden-email-notifiers")
            .split(";")
            .sort(Intl.Collator().compare);
        group = builder.get_object("messagingmenu_group_emailnotifiers");
        this._fillgroup(group, apps);

        apps = settings
            .get_string("compatible-hidden-mblog-notifiers")
            .split(";")
            .sort(Intl.Collator().compare);
        group = builder.get_object("messagingmenu_group_mblognotifiers");
        this._fillgroup(group, apps);
    }

    fillPreferencesWindow(window) {
        window.set_default_size(675, 700);
        const builder = Gtk.Builder.new();
        builder.add_from_file(this.path + "/prefs.ui");
        const page1 = builder.get_object("messagingmenu_page_settings");
        window.add(page1);
        const page2 = builder.get_object("messagingmenu_page_email");
        window.add(page2);
        const page3 = builder.get_object("messagingmenu_page_chat");
        window.add(page3);
        const page4 = builder.get_object("messagingmenu_page_mblog");
        window.add(page4);
        const page5 = builder.get_object("messagingmenu_page_notifiers");
        window.add(page5);
        this._page1(builder, this.getSettings());
        this._pages(builder, this.getSettings());
    }
}
