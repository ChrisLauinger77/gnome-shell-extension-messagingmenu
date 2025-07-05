/**
 * Messaging Menu - A Messaging Menu for the Gnome Shell
 * Copyright (C) 2012 Andreas Wilhelm
 * See LICENSE.txt for details
 */

import Shell from "gi://Shell";
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import St from "gi://St";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as Util from "resource:///org/gnome/shell/misc/util.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import { Extension, gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

const _rgbToHex = (r, g, b) => "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");

const MessageMenuItem = GObject.registerClass(
    class MessageMenu_MessageMenuItem extends PopupMenu.PopupBaseMenuItem {
        constructor(app, intIcon_size) {
            super();
            this._app = app;

            this.label = new St.Label({
                text: app.get_name(),
                style_class: "program-label",
            });
            this.add_child(this.label);

            this._icon = app.create_icon_texture(intIcon_size);
            this.add_child(this._icon);
        }

        activate(event) {
            this._app.activate_full(-1, event.get_time());
            super.activate(event);
        }
    }
);

const MessageMenu = GObject.registerClass(
    class MessageMenu_MessageMenu extends PanelMenu.Button {
        _init(Me, intIcon_size) {
            this._settings = Me._settings;
            this._intIcon_size = intIcon_size;
            super._init(0.0, "MessageMenu");

            this._compatible_Chats = this._settings.get_string("compatible-chats").split(";").sort();
            this._compatible_MBlogs = this._settings
                .get_string("compatible-mblogs")
                .split(";")
                .sort(Intl.Collator().compare);
            this._compatible_Emails = this._settings
                .get_string("compatible-emails")
                .split(";")
                .sort(Intl.Collator().compare);
            this._compatibleHiddenEmailNotifiers = this._settings
                .get_string("compatible-hidden-email-notifiers")
                .split(";")
                .sort(Intl.Collator().compare);
            this._compatibleHiddenMBlogNotifiers = this._settings
                .get_string("compatible-hidden-mblog-notifiers")
                .split(";")
                .sort(Intl.Collator().compare);

            const hbox = new St.BoxLayout({
                style_class: "panel-status-menu-box",
            });
            const gicon = Gio.icon_new_for_string(Me.path + "/icons/mymail-symbolic.svg");
            const icon = new St.Icon({
                gicon,
                style_class: "system-status-icon",
            });

            hbox.add_child(icon);
            this.add_child(hbox);

            this.new_msg_string = _("Compose New Message");
            this.contacts_string = _("Contacts");

            this._availableEmails = [];
            this._availableChats = [];
            this._availableMBlogs = [];
            this._availableNotifiers = [];

            this._thunderbird = null;
            this._icedove = null;
            this._kmail = null;
            this._claws = null;
            this._evolution = null;
            this._geary = null;

            const appsys = Shell.AppSystem.get_default();
            this._getAppsEMAIL(appsys);
            this._getAppsCHAT(appsys);
            this._getAppsBLOG(appsys);
            if (this._evolution !== null) {
                this._buildMenuEVOLUTION();
            }
            if (this._thunderbird !== null) {
                this._buildMenuTHUNDERBIRD();
            }
            if (this._icedove !== null) {
                this._buildMenuICEDOVE();
            }
            if (this._kmail !== null) {
                this._buildMenuKMAIL();
            }
            if (this._claws !== null) {
                this._buildMenuCLAWS();
            }
            if (this._geary !== null) {
                this._buildMenuGEARY();
            }
            this._buildMenu(Me);
        }

        get AvailableNotifiers() {
            return this._availableNotifiers;
        }

        get compatibleHiddenEmailNotifiers() {
            return this._compatibleHiddenEmailNotifiers;
        }

        get compatibleHiddenMBlogNotifiers() {
            return this._compatibleHiddenMBlogNotifiers;
        }

        _buildMenuEVOLUTION() {
            const newLauncher = new MessageMenuItem(this._evolution, this._intIcon_size);
            this.menu.addMenuItem(newLauncher);

            this.comp = new PopupMenu.PopupImageMenuItem(this.new_msg_string + "...", "mail-message-new-symbolic", {
                style_class: "special-action",
            });
            this.con = new PopupMenu.PopupImageMenuItem(this.contacts_string, "contact-new-symbolic", {
                style_class: "special-action",
            });

            this.con.connect("activate", this._evolutionContacts.bind(this));
            this.comp.connect("activate", this._evolutionCompose.bind(this));
            this.menu.addMenuItem(this.comp);
            this.menu.addMenuItem(this.con);
        }

        _buildMenuTHUNDERBIRD() {
            const newLauncher = new MessageMenuItem(this._thunderbird, this._intIcon_size);
            this.menu.addMenuItem(newLauncher);

            this.comp_tb = new PopupMenu.PopupImageMenuItem(this.new_msg_string + "...", "mail-message-new-symbolic", {
                style_class: "special-action",
            });
            this.con_tb = new PopupMenu.PopupImageMenuItem(this.contacts_string, "contact-new-symbolic", {
                style_class: "special-action",
            });

            this.comp_tb.connect("activate", this._TbCompose.bind(this));
            this.menu.addMenuItem(this.comp_tb);

            this.con_tb.connect("activate", this._TbContacts.bind(this));
            this.menu.addMenuItem(this.con_tb);
        }

        _buildMenuICEDOVE() {
            const newLauncher = new MessageMenuItem(this._icedove, this._intIcon_size);
            this.menu.addMenuItem(newLauncher);

            this.comp_icedove = new PopupMenu.PopupImageMenuItem(
                this.new_msg_string + "...",
                "mail-message-new-symbolic",
                { style_class: "special-action" }
            );
            this.con_icedove = new PopupMenu.PopupImageMenuItem(this.contacts_string, "contact-new-symbolic", {
                style_class: "special-action",
            });

            this.comp_icedove.connect("activate", this._icedoveCompose.bind(this));
            this.menu.addMenuItem(this.comp_icedove);

            this.con_icedove.connect("activate", this._icedoveContacts.bind(this));
            this.menu.addMenuItem(this.con_icedove);
        }

        _buildMenuKMAIL() {
            const newLauncher = new MessageMenuItem(this._kmail, this._intIcon_size);
            this.menu.addMenuItem(newLauncher);

            this.comp = new PopupMenu.PopupImageMenuItem(this.new_msg_string + "...", "mail-message-new-symbolic", {
                style_class: "special-action",
            });

            this.comp.connect("activate", this._kmailCompose.bind(this));
            this.menu.addMenuItem(this.comp);
        }

        _buildMenuCLAWS() {
            const newLauncher = new MessageMenuItem(this._claws, this._intIcon_size);
            this.menu.addMenuItem(newLauncher);

            this.comp = new PopupMenu.PopupImageMenuItem(this.new_msg_string + "...", "mail-message-new-symbolic", {
                style_class: "special-action",
            });

            this.comp.connect("activate", this._clawsCompose.bind(this));
            this.menu.addMenuItem(this.comp);
        }

        _buildMenuGEARY() {
            const newLauncher = new MessageMenuItem(this._geary, this._intIcon_size);
            this.menu.addMenuItem(newLauncher);

            this.comp = new PopupMenu.PopupImageMenuItem(this.new_msg_string + "...", "mail-message-new-symbolic", {
                style_class: "special-action",
            });

            this.comp.connect("activate", this._gearyCompose.bind(this));
            this.menu.addMenuItem(this.comp);
        }

        _buildMenu(Me) {
            for (let e_app of this._availableEmails) {
                let newLauncher = new MessageMenuItem(e_app, this._intIcon_size);
                this.menu.addMenuItem(newLauncher);
            }
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            // insert Chat Clients into menu
            for (let c_app of this._availableChats) {
                let newLauncher = new MessageMenuItem(c_app, this._intIcon_size);
                this.menu.addMenuItem(newLauncher);
            }
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            // insert Blogging Clients into menu
            for (let mb_app of this._availableMBlogs) {
                let newLauncher = new MessageMenuItem(mb_app, this._intIcon_size);
                this.menu.addMenuItem(newLauncher);
            }

            // Add an entry-point for settings
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            const settingsItem = this.menu.addAction(_("Settings"), () => Me._openPreferences());
            // Ensure the settings are unavailable when the screen is locked
            settingsItem.visible = Main.sessionMode.allowSettings;
            this.menu._settingsActions[Me.uuid] = settingsItem;
        }

        _getAppsEMAIL(appsys) {
            //get available Email Apps
            for (let app_name of this._compatible_Emails) {
                let app = appsys.lookup_app(app_name + ".desktop");
                if (app !== null) {
                    // filter Apps with special Menus
                    if (app_name.toLowerCase().includes("thunderbird")) {
                        this._thunderbird = app;
                    } else if (app_name.toLowerCase().includes("icedove")) {
                        this._icedove = app;
                    } else if (app_name.toLowerCase().includes("kmail")) {
                        this._kmail = app;
                    } else if (app_name.toLowerCase().includes("claws")) {
                        this._claws = app;
                    } else if (app_name.toLowerCase().includes("evolution")) {
                        this._evolution = app;
                    } else if (app_name.toLowerCase().includes("geary")) {
                        this._geary = app;
                    } else {
                        this._availableEmails.push(app);
                    }
                    if (this._settings.get_boolean("notify-email")) {
                        this._availableNotifiers.push(app);
                    }
                }
            }
        }

        _getAppsCHAT(appsys) {
            //get available Chat Apps
            for (let c_app of this._compatible_Chats) {
                let app_name = c_app;
                let app = appsys.lookup_app(app_name + ".desktop");

                if (app !== null) {
                    this._availableChats.push(app);
                    if (this._settings.get_boolean("notify-chat")) {
                        this._availableNotifiers.push(app);
                    }
                }
            }
        }

        _getAppsBLOG(appsys) {
            //get available Blogging Apps
            for (let mb_app of this._compatible_MBlogs) {
                let app_name = mb_app;
                let app = appsys.lookup_app(app_name + ".desktop");

                if (app !== null) {
                    this._availableMBlogs.push(app);
                    if (this._settings.get_boolean("notify-mblogging")) {
                        this._availableNotifiers.push(app);
                    }
                }
            }
        }

        _TbCompose() {
            Util.trySpawnCommandLine("thunderbird -compose");
        }

        _TbContacts() {
            Util.trySpawnCommandLine("thunderbird -addressbook");
        }

        _icedoveCompose() {
            Util.trySpawnCommandLine("icedove -compose");
        }

        _icedoveContacts() {
            Util.trySpawnCommandLine("icedove -addressbook");
        }

        _kmailCompose() {
            Util.trySpawnCommandLine("kmail -compose");
        }

        _clawsCompose() {
            Util.trySpawnCommandLine("claws-mail --compose");
        }

        _evolutionCompose() {
            Util.trySpawnCommandLine("evolution mailto:");
        }

        _evolutionContacts() {
            Util.trySpawnCommandLine("evolution -c contacts");
        }

        _gearyCompose() {
            Util.trySpawnCommandLine("geary mailto:user@example.com");
        }

        destroy() {
            super.destroy();
        }
    }
);

export default class MessagingMenu extends Extension {
    _updateMessageStatus() {
        // get all Messages
        let sources = Main.messageTray.getSources();
        let newMessage = false;

        for (let source of sources) {
            // check for new Chat Messages
            if (
                this._settings.get_boolean("notify-chat") &&
                source.isChat &&
                !source.isMuted &&
                this._unseenMessageCheck(source)
            ) {
                newMessage = true;
            } else if (source.app) {
                if (this._settings.get_boolean("notify-email")) {
                    newMessage =
                        this._checkNotifyEmailByID(source) ||
                        this._checkHiddenNotifierMatch(source, this._indicator.compatibleHiddenEmailNotifiers);
                }
            } else {
                if (this._settings.get_boolean("notify-email")) {
                    newMessage =
                        this._checkNotifyEmailByName(source) ||
                        this._checkHiddenNotifierMatch(source, this._indicator.compatibleHiddenEmailNotifiers);
                }
                if (this._settings.get_boolean("notify-mblogging")) {
                    newMessage =
                        newMessage ||
                        this._checkHiddenNotifierMatch(source, this._indicator.compatibleHiddenMBlogNotifiers);
                }
            }
        }
        this._changeStatusIcon(newMessage);
    }

    _checkNotifyEmailByID(source) {
        // check for Message from known Email App
        let result = false;
        if (source.app) {
            for (let notifier of this._indicator.AvailableNotifiers) {
                let app_id = notifier.get_id(); //e.g. thunderbird.desktop
                if (app_id.toLowerCase().includes(source.app.get_id().toLowerCase())) {
                    result = true;
                }
            }
        }
        return result;
    }

    _checkNotifyEmailByName(source) {
        let result = false;
        if (source.title) {
            for (let notifier of this._indicator.AvailableNotifiers) {
                let app_name = notifier.get_name(); //e.g. Thunderbird Mail
                if (app_name.toLowerCase().includes(source.title.toLowerCase())) {
                    result = true;
                }
            }
        }
        return result;
    }

    _checkHiddenNotifierMatch(source, notifiers) {
        let result = false;
        if (source.title) {
            for (let notifier of notifiers) {
                if (notifier.toLowerCase().includes(source.title.toLowerCase())) {
                    result = true;
                }
            }
        }
        return result;
    }

    _changeStatusIcon(newMessage) {
        // Change Status Icon in Panel
        if (newMessage && !this._iconChanged) {
            let color;
            let strcolor = this._settings.get_string("color-rgba");
            let arrColor = strcolor.replace("rgb(", "").replace(")", "").split(",");
            color = _rgbToHex(parseInt(arrColor[0]), parseInt(arrColor[1]), parseInt(arrColor[2]));
            this._iconBox.set_style("color: " + color + ";");
            this._iconChanged = true;
        } else if (!newMessage && this._iconChanged) {
            this._iconBox.set_style(this._originalStyle);
            this._iconChanged = false;
        }
    }

    _unseenMessageCheck(source) {
        let unseen = false;
        if (source.countVisible === undefined) {
            unseen = source.unseenCount > 0;
        } else {
            unseen = source.countVisible > 0;
        }
        return unseen;
    }

    _queuechanged() {
        try {
            this._updateMessageStatus();
        } catch (err) {
            /* If the extension is broken I don't want to break everything.
             * We just catch the extension, print it and go on */
            this.getLogger().error(err);
        }
    }

    _openPreferences() {
        this.openPreferences();
    }

    onParamChanged() {
        this.disable();
        this.enable();
    }

    enable() {
        this._settings = this.getSettings();
        let icon_size = this._settings.get_int("icon-size");
        this._indicator = new MessageMenu(this, icon_size);

        // add Signals to array
        this._settingSignals = [];
        const settingsToMonitor = [
            { key: "compatible-chats", callback: "onParamChanged" },
            { key: "compatible-mblogs", callback: "onParamChanged" },
            { key: "compatible-emails", callback: "onParamChanged" },
            { key: "icon-size", callback: "onParamChanged" },
        ];
        settingsToMonitor.forEach((setting) => {
            this._settingSignals.push(
                this._settings.connect(`changed::${setting.key}`, this[setting.callback].bind(this))
            );
        });

        const statusArea = Main.panel.statusArea;

        Main.panel.addToStatusArea("messageMenu", this._indicator, 1);

        this._iconBox = statusArea.messageMenu;
        this._iconChanged = false;
        this._originalStyle = this._iconBox.get_style();
        this._messageTraySignal = Main.messageTray.connect("queue-changed", this._queuechanged.bind(this));
    }

    disable() {
        // remove setting Signals
        this._settingSignals.forEach(function (signal) {
            this._settings.disconnect(signal);
        }, this);
        this._settingSignals = null;
        if (this._messageTraySignal !== null) {
            Main.messageTray.disconnect(this._messageTraySignal);
        }
        this._messageTraySignal = null;
        this._indicator.destroy();
        this._indicator = null;
        this._settings = null;
        this._iconBox = null;
        this._iconChanged = null;
        this._originalStyle = null;
    }
}
