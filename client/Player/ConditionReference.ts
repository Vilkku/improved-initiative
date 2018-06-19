import * as ko from "knockout";
import * as _ from "lodash";

import { Tag } from "../Combatant/Tag";
import { Conditions } from "../Rules/Conditions";

export class ConditionReference {
    public ReferenceVisible = ko.observable(false);
    public Tag: KnockoutObservable<Tag> = ko.observable(null);

    public Title = ko.pureComputed(() => {
        if (this.Tag()) {
            return _.startCase(this.Tag().Text);
        } else {
            return "";
        }
    });

    public Contents = ko.pureComputed(() => {
        if (this.Tag()) {
            return Conditions[_.startCase(this.Tag().Text)];
        } else {
            return "";
        }
    });

    public Show = (tag : Tag) => {
        const casedConditionName = _.startCase(tag.Text);

        if (Conditions[casedConditionName]) {
            this.Tag(tag);
            this.ReferenceVisible(true);
        }
    };

    public Close = () => {
        this.ReferenceVisible(false);
    }
}
