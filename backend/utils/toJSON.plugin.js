/**
 * Global Mongoose plugin: exposes `id` instead of `_id`, drops `__v` and any
 * field marked `private: true` in the schema, so API responses stay clean.
 */
module.exports = function toJSONPlugin(schema) {
  const privatePaths = [];
  schema.eachPath((path, type) => {
    if (type.options && type.options.private) privatePaths.push(path);
  });

  const transform = (doc, ret) => {
    if (ret._id !== undefined) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    delete ret.__v;
    privatePaths.forEach((path) => delete ret[path]);
    return ret;
  };

  schema.set('toJSON', { virtuals: true, versionKey: false, transform });
  schema.set('toObject', { virtuals: true, versionKey: false });
};
