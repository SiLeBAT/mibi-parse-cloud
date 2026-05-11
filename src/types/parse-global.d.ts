import * as _Parse from 'parse/node';

declare global {
    namespace Parse {
        export import Attributes = _Parse.Attributes;
        export import Cloud = _Parse.Cloud;
        export import Config = _Parse.Config;
        export import File = _Parse.File;
        export import Object = _Parse.Object;
        export import Query = _Parse.Query;
        export import Schema = _Parse.Schema;
        export import User = _Parse.User;
    }
}
