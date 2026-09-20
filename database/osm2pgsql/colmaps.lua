local features = osm2pgsql.define_table({
    name = 'osm_features',

    ids = {
        type = 'any',
        id_column = 'osm_id',
        type_column = 'osm_type',
    },

    columns = {
        { column = 'name', type = 'text' },
        { column = 'tags', type = 'jsonb' },
        { column = 'geom', type = 'geometry' },
    },
})


local function insert_object(object, geometry)
    if not object.tags then
        return
    end

    features:insert({
        name = object.tags.name,
        tags = object.tags,
        geom = geometry,
    })
end


function osm2pgsql.process_node(object)
    insert_object(
        object,
        object:as_point()
    )
end


function osm2pgsql.process_way(object)
    if object.is_closed then
        local polygon = object:as_polygon()

        if not polygon:is_null() then
            insert_object(object, polygon)
            return
        end
    end

    insert_object(
        object,
        object:as_linestring()
    )
end


function osm2pgsql.process_relation(object)
    local relation_type = object.tags.type
    local geometry

    if relation_type == 'multipolygon' then
        geometry = object:as_multipolygon()
    else
        geometry = object:as_geometrycollection()
    end

    if geometry:is_null() then
        return
    end

    insert_object(object, geometry)
end