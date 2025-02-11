import Gdk from "gi://Gdk";
import Gtk from "gi://Gtk";
import Gio from "gi://Gio";
import Adw from "gi://Adw";
import GObject from "gi://GObject";
import {
    ExtensionPreferences,
    gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

const errorLog = (...args) => {
    console.error("[MessagingMenu]", "Error:", ...args);
};

const handleError = (error) => {
    errorLog(error);
    return null;
};

const AppChooser = GObject.registerClass(
    class AppChooser extends Adw.Window {
        constructor(params = {}) {
            super(params);
            let adwtoolbarview = new Adw.ToolbarView();
            let adwheaderbar = new Adw.HeaderBar();
            adwtoolbarview.add_top_bar(adwheaderbar);
            this.set_content(adwtoolbarview);
            let scrolledwindow = new Gtk.ScrolledWindow();
            adwtoolbarview.set_content(scrolledwindow);
            this.listBox = new Gtk.ListBox({
                selection_mode: Gtk.SelectionMode.SINGLE,
            });
            scrolledwindow.set_child(this.listBox);
            this.selectBtn = new Gtk.Button({
                label: _("Select"),
                css_classes: ["suggested-action"],
            });
            this.cancelBtn = new Gtk.Button({ label: _("Cancel") });
            adwheaderbar.pack_start(this.cancelBtn);
            adwheaderbar.pack_end(this.selectBtn);
            const apps = Gio.AppInfo.get_all();

            for (const app of apps) {
                if (app.should_show() === false) continue;
                const row = new Adw.ActionRow();
                row.title = app.get_display_name();
                row.subtitle = app.get_id();
                row.subtitleLines = 1;
                const icon = new Gtk.Image({ gicon: app.get_icon() });
                row.add_prefix(icon);
                this.listBox.append(row);
            }

            this.cancelBtn.connect("clicked", () => {
                this.close();
            });
        }

        showChooser() {
            return new Promise((resolve) => {
                const signalId = this.selectBtn.connect("clicked", () => {
                    this.close();
                    this.selectBtn.disconnect(signalId);
                    const row = this.listBox.get_selected_row();
                    resolve(row);
                });
                this.present();
            });
        }
    }
);

export default class AdwPrefs extends ExtensionPreferences {
    _addMenuChangeDesc(cmb_add, group_add) {
        if (cmb_add.get_selected() < 3) {
            group_add.set_description(
                _("Name of .desktop files without .desktop ending")
            );
        } else {
            group_add.set_description(_("Notifier title"));
        }
    }

    _addMenu(cmb_add, entry_add, builder) {
        if (entry_add.get_text() === "") {
            return;
        }
        let strsettings;
        let strgroup;
        switch (cmb_add.get_selected()) {
            case 0:
                strsettings = "compatible-emails";
                strgroup = "messagingmenu_group_email";
                break;
            case 1:
                strsettings = "compatible-chats";
                strgroup = "messagingmenu_group_chat";
                break;
            case 2:
                strsettings = "compatible-mblogs";
                strgroup = "messagingmenu_group_mblog";
                break;
            case 3:
                strsettings = "compatible-hidden-email-notifiers";
                strgroup = "messagingmenu_group_emailnotifiers";
                break;
            case 4:
                strsettings = "compatible-hidden-mblog-notifiers";
                strgroup = "messagingmenu_group_mblognotifiers";
                break;
            default:
                console.log("_addMenu did not find get_active_id");
        }
        let valuesettings = this.getSettings().get_string(strsettings);
        if (
            !valuesettings.toLowerCase().includes(entry_add.text.toLowerCase())
        ) {
            this.getSettings().set_string(
                strsettings,
                valuesettings + ";" + entry_add.text
            );
            const group = builder.get_object(strgroup);
            const adwrow = new Adw.ActionRow({ title: entry_add.text });
            group.add(adwrow);
            entry_add.text = "";
        }
    }

    _onColorChanged(color_setting_button) {
        this.getSettings().set_string(
            "color-rgba",
            color_setting_button.get_rgba().to_string()
        );
    }

    _page1(builder, settings, myAppChooser) {
        const email_setting_switch = builder.get_object("messagingmenu_row1");
        email_setting_switch.set_tooltip_text(_("Toggle email notification"));
        settings.bind(
            "notify-email",
            email_setting_switch,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );
        const chat_setting_switch = builder.get_object("messagingmenu_row2");
        chat_setting_switch.set_tooltip_text(_("Toggle chat notification"));
        settings.bind(
            "notify-chat",
            chat_setting_switch,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );
        const mblogging_setting_switch =
            builder.get_object("messagingmenu_row3");
        mblogging_setting_switch.set_tooltip_text(
            _("Toggle micro blogging notification")
        );
        settings.bind(
            "notify-mblogging",
            mblogging_setting_switch,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );
        const color_setting_button = builder.get_object("color_setting_button");
        color_setting_button.set_tooltip_text(_("Notification Color RGB"));
        const mycolor = new Gdk.RGBA();
        mycolor.parse(this.getSettings().get_string("color-rgba"));
        color_setting_button.set_rgba(mycolor);
        color_setting_button.connect(
            "color-set",
            this._onColorChanged.bind(this, color_setting_button)
        );
        const row5 = builder.get_object("messagingmenu_row5");
        settings.bind(
            "icon-size",
            row5,
            "value",
            Gio.SettingsBindFlags.DEFAULT
        );

        const group_add = builder.get_object("messagingmenu_group_add");
        const cmb_add = builder.get_object("messagingmenu_cmb_add");
        cmb_add.set_selected(0);
        cmb_add.connect(
            "notify",
            this._addMenuChangeDesc.bind(this, cmb_add, group_add)
        );
        const button_add = builder.get_object("button_add_menu_add");
        button_add.set_css_classes(["suggested-action"]);
        const entry_add = builder.get_object("messagingmenu_row_add2");
        button_add.connect(
            "clicked",
            this._addMenu.bind(this, cmb_add, entry_add, builder)
        );
        entry_add.set_tooltip_text(
            _("Usually located in '/usr/share/applications'")
        );
        const buttonfilechooser = new Gtk.Button({
            label: _("..."),
            valign: Gtk.Align.CENTER,
        });
        entry_add.add_suffix(buttonfilechooser);
        entry_add.activatable_widget = buttonfilechooser;
        buttonfilechooser.connect("clicked", async () => {
            const appRow = await myAppChooser.showChooser().catch(handleError);
            if (appRow !== null) {
                entry_add.set_text(appRow.subtitle.replace(".desktop", ""));
            }
        });
    }

    _fillgroup(group, applist) {
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
        const myAppChooser = new AppChooser({
            title: _("Select app"),
            modal: true,
            transient_for: page1.get_root(),
            hide_on_close: true,
            width_request: 300,
            height_request: 600,
            resizable: false,
        });
        const page2 = builder.get_object("messagingmenu_page_email");
        window.add(page2);
        const page3 = builder.get_object("messagingmenu_page_chat");
        window.add(page3);
        const page4 = builder.get_object("messagingmenu_page_mblog");
        window.add(page4);
        const page5 = builder.get_object("messagingmenu_page_notifiers");
        window.add(page5);
        this._page1(builder, this.getSettings(), myAppChooser);
        this._pages(builder, this.getSettings());
    }
}
