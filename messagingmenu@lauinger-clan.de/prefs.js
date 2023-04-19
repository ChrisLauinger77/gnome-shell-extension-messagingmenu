const ExtensionUtils = imports.misc.extensionUtils;
const { Gtk, Gdk, GObject, Gio } = imports.gi;
const Me = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain("messagingmenu");
const _ = Gettext.gettext;
const g_schema = "org.gnome.shell.extensions.messagingmenu";

function init() {
    ExtensionUtils.initTranslations("messagingmenu");
}

class Prefs {
    constructor(schema) {
        this._settings = ExtensionUtils.getSettings(schema);
    }

    _createColorSettingWidget() {
        let hbox1 = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
            margin_top: 5,
        });

        let color_setting_label = new Gtk.Label({
            label: _("Notification Color (Hex):"),
            xalign: 0,
        });

        let color_setting_string = new Gtk.Entry({
            text: this._settings.get_string("color"),
        });
        color_setting_string.connect("notify::text", function (entry) {
            // only save correct color hexcode
            if (entry.text.length == 7 && entry.text.charAt(0) == "#") {
                this._settings.set_string("color", entry.text);
            }
        });

        hbox1.prepend(color_setting_label);
        hbox1.append(color_setting_string);

        return hbox1;
    }

    _createNotificationSettingsWidget() {
        let vbox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
        });

        let hbox1 = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
            margin_top: 5,
        });

        let email_setting_label = new Gtk.Label({
            label: _("Email Notification:"),
            xalign: 0,
        });

        let email_setting_switch = new Gtk.Switch({
            active: this._settings.get_boolean("notify-email"),
        });
        email_setting_switch.connect("notify::active", function (button) {
            this._settings.set_boolean("notify-email", button.active);
        });

        hbox1.prepend(email_setting_label);
        hbox1.append(email_setting_switch);
        vbox.append(hbox1);

        let hbox2 = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
            margin_top: 5,
        });

        let chat_setting_label = new Gtk.Label({
            label: _("Chat Notification:"),
            xalign: 0,
        });

        let chat_setting_switch = new Gtk.Switch({
            active: this._settings.get_boolean("notify-chat"),
        });
        chat_setting_switch.connect("notify::active", function (button) {
            this._settings.set_boolean("notify-chat", button.active);
        });

        hbox2.prepend(chat_setting_label);
        hbox2.append(chat_setting_switch);
        vbox.append(hbox2);

        let hbox3 = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
            margin_top: 5,
        });

        let mblogging_setting_label = new Gtk.Label({
            label: _("Micro Blogging Notification:"),
            xalign: 0,
        });

        let mblogging_setting_switch = new Gtk.Switch({
            active: this._settings.get_boolean("notify-mblogging"),
        });
        mblogging_setting_switch.connect("notify::active", function (button) {
            this._settings.set_boolean("notify-mblogging", button.active);
        });

        hbox3.prepend(mblogging_setting_label);
        hbox3.append(mblogging_setting_switch);
        vbox.append(hbox3);

        return vbox;
    }

    _buildPrefsWidget() {
        let frame = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
        });
        let vbox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            margin_top: 10,
        });
        let notifySettings = this._createNotificationSettingsWidget();
        let colorSetting = this._createColorSettingWidget();
        vbox.append(notifySettings);
        vbox.append(colorSetting);
        frame.append(vbox);

        return frame;
    }
}

// used in GNOME 41 (41 and older)
function buildPrefsWidget() {
    let prefs = new Prefs(g_schema);

    return prefs._buildPrefsWidget();
}

class AdwPrefs {
    constructor(schema, window) {
        this._settings = ExtensionUtils.getSettings(schema);
        this._window = window;
        this._builder = null;
        this._filechooser = null;
    }

    _addMenuChangeDesc(cmb_add, group_add) {
        if (cmb_add.get_active() < 3) {
            group_add.set_description(
                _("Name of .desktop files without .desktop ending")
            );
        } else {
            group_add.set_description(_("Notifier title"));
        }
    }

    _addMenu(cmb_add, entry_add) {
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
        let valuesettings = this._settings.get_string(strsettings);
        if (
            !valuesettings.toLowerCase().includes(entry_add.text.toLowerCase())
        ) {
            this._settings.set_string(
                strsettings,
                valuesettings + ";" + entry_add.text
            );
            let group = this._builder.get_object(strgroup);
            const { Adw } = imports.gi;
            let adwrow = new Adw.ActionRow({ title: entry_add.text });
            group.add(adwrow);
            entry_add.text = "";
        }
    }

    _onBtnClicked(btn) {
        let parent = btn.get_root();
        this._filechooser.set_transient_for(parent);

        let desktopFileFilter = new Gtk.FileFilter();
        this._filechooser.set_filter(desktopFileFilter);
        desktopFileFilter.add_pattern("*.desktop");

        this._filechooser.title = _("Select desktop file");

        this._filechooser.show();
    }

    _getFilename(fullPath) {
        return fullPath.replace(/^.*[\\\/]/, "");
    }

    _onFileChooserResponse(native, response) {
        if (response !== Gtk.ResponseType.ACCEPT) {
            return;
        }
        let fileURI = native.get_file().get_uri().replace("file://", "");

        let entry_add = this._builder.get_object("entry_add_menu_name");
        entry_add.text = this._getFilename(fileURI).replace(".desktop", "");
    }

    _onColorChanged(color_setting_button) {
        this._settings.set_string(
            "color-rgba",
            color_setting_button.get_rgba().to_string()
        );
    }

    _page1() {
        let email_setting_switch = this._builder.get_object(
            "email_setting_switch"
        );
        email_setting_switch.set_tooltip_text(_("Toggle email notification"));
        this._settings.bind(
            "notify-email",
            email_setting_switch,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );
        let chat_setting_switch = this._builder.get_object(
            "chat_setting_switch"
        );
        chat_setting_switch.set_tooltip_text(_("Toggle chat notification"));
        this._settings.bind(
            "notify-chat",
            chat_setting_switch,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );
        let mblogging_setting_switch = this._builder.get_object(
            "mblogging_setting_switch"
        );
        mblogging_setting_switch.set_tooltip_text(
            _("Toggle micro blogging notification")
        );
        this._settings.bind(
            "notify-mblogging",
            mblogging_setting_switch,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );
        let color_setting_button = this._builder.get_object(
            "color_setting_button"
        );
        color_setting_button.set_tooltip_text(_("Notification Color RGB"));
        let mycolor = new Gdk.RGBA();
        mycolor.parse(this._settings.get_string("color-rgba"));
        color_setting_button.set_rgba(mycolor);
        color_setting_button.connect(
            "color-set",
            this._onColorChanged.bind(this, color_setting_button)
        );
        let group_add = this._builder.get_object("messagingmenu_group_add");
        let cmb_add = this._builder.get_object("messagingmenu_cmb_add");
        cmb_add.set_active(0);
        cmb_add.connect(
            "changed",
            this._addMenuChangeDesc.bind(this, cmb_add, group_add)
        );
        let button_add = this._builder.get_object("button_add_menu_add");
        let entry_add = this._builder.get_object("entry_add_menu_name");
        button_add.connect(
            "clicked",
            this._addMenu.bind(this, cmb_add, entry_add)
        );

        let adwrow = this._builder.get_object("messagingmenu_row_add2");
        adwrow.set_tooltip_text(
            _("Usually located in '/usr/share/applications'")
        );
        let buttonfilechooser = new Gtk.Button({
            label: _("..."),
            valign: Gtk.Align.CENTER,
        });
        adwrow.add_suffix(buttonfilechooser);
        adwrow.activatable_widget = buttonfilechooser;
        buttonfilechooser.connect(
            "clicked",
            this._onBtnClicked.bind(this, buttonfilechooser)
        );
        this._filechooser = new Gtk.FileChooserNative({
            title: _("Select desktop file for ") + cmb_add.get_active_id,
            modal: true,
            action: Gtk.FileChooserAction.OPEN,
        });
        this._filechooser.connect(
            "response",
            this._onFileChooserResponse.bind(this)
        );
    }

    _fillgroup(group, applist) {
        const { Adw } = imports.gi;
        for (let app of applist) {
            let adwrow = new Adw.ActionRow({ title: app });
            group.add(adwrow);
        }
    }

    _pages() {
        let apps = this._settings
            .get_string("compatible-emails")
            .split(";")
            .sort(Intl.Collator().compare);
        let group = this._builder.get_object("messagingmenu_group_email");
        this._fillgroup(group, apps);

        apps = this._settings
            .get_string("compatible-chats")
            .split(";")
            .sort(Intl.Collator().compare);
        group = this._builder.get_object("messagingmenu_group_chat");
        this._fillgroup(group, apps);

        apps = this._settings
            .get_string("compatible-mblogs")
            .split(";")
            .sort(Intl.Collator().compare);
        group = this._builder.get_object("messagingmenu_group_mblog");
        this._fillgroup(group, apps);

        apps = this._settings
            .get_string("compatible-hidden-email-notifiers")
            .split(";")
            .sort(Intl.Collator().compare);
        group = this._builder.get_object("messagingmenu_group_emailnotifiers");
        this._fillgroup(group, apps);

        apps = this._settings
            .get_string("compatible-hidden-mblog-notifiers")
            .split(";")
            .sort(Intl.Collator().compare);
        group = this._builder.get_object("messagingmenu_group_mblognotifiers");
        this._fillgroup(group, apps);
    }

    _fillPreferencesWindow() {
        this._window.set_default_size(675, 700);
        this._builder = Gtk.Builder.new();
        this._builder.add_from_file(Me.path + "/prefs.ui");
        let page1 = this._builder.get_object("messagingmenu_page_settings");
        this._window.add(page1);
        let page2 = this._builder.get_object("messagingmenu_page_email");
        this._window.add(page2);
        let page3 = this._builder.get_object("messagingmenu_page_chat");
        this._window.add(page3);
        let page4 = this._builder.get_object("messagingmenu_page_mblog");
        this._window.add(page4);
        let page5 = this._builder.get_object("messagingmenu_page_notifiers");
        this._window.add(page5);
        this._page1();
        this._pages();
    }
}

// used starting with GNOME 42 (42 and newer)
function fillPreferencesWindow(window) {
    let adwprefs = new AdwPrefs(g_schema, window);

    return adwprefs._fillPreferencesWindow();
}
